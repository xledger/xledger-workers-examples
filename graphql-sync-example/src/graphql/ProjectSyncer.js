import * as dbQueries from "../db/queries.js";
import * as gqlQueries from "./queries.js";
import m from "../mappings.js";
import * as u from "../util.js";
import { default as SyncStatus, SyncKind } from "../db/models/SyncStatus.js";
import { DataError } from "../DataError.js";

export const ProjectSyncState = {
  NotStarted: Symbol("NotStarted"),
  Initializing: Symbol("Initializing"),
  CursorSyncing: Symbol("CursorSyncing"),
  IncrementallySyncing: Symbol("IncrementallySyncing"),
  WebhookListening: Symbol("WebhookListening"),
};

const FIELD_MAPPINGS = {
  code: m.STRING,
  description: m.STRING,
  text: m.STRING,
  email: m.STRING,
  yourReference: m.STRING,
  extIdentifier: m.STRING,
  extOrder: m.STRING,
  contract: m.STRING,
  overview: m.STRING,
  invoiceHeader: m.STRING,
  invoiceFooter: m.STRING,
  shortInfo: m.STRING,
  shortInternalInfo: m.STRING,
  fromDate: m.DATE,
  toDate: m.DATE,
  totalRevenue: m.MONEY_STRING,
  yearlyRevenue: m.MONEY_STRING,
  contractedRevenue: m.MONEY_STRING,
  totalCost: m.MONEY_STRING,
  yearlyCost: m.MONEY_STRING,
  pctCompleted: m.FLOAT,
  totalEstimateHours: m.FLOAT,
  yearlyEstimateHours: m.FLOAT,
  budgetCoveragePercent: m.FLOAT,
  external: m.BOOLEAN,
  billable: m.BOOLEAN,
  fixedClient: m.BOOLEAN,
  allowPosting: m.BOOLEAN,
  timesheetEntry: m.BOOLEAN,
  accessControl: m.BOOLEAN,
  assignment: m.BOOLEAN,
  activity: m.BOOLEAN,
  expenseLedger: m.BOOLEAN,
  fundProject: m.BOOLEAN,
  createdAt: m.CET_DATETIME,
  modifiedAt: m.CET_DATETIME,
  progressDate: m.CET_DATETIME,
};

const PROJECT_REF_FIELDS = ["mainProject"];

const OBJECT_VALUE_REF_FIELDS = ["xgl", "glObject1", "glObject2", "glObject3", "glObject4", "glObject5"];

export class ProjectSyncer {
  #client;

  constructor(client) {
    this.#client = client;
  }

  async run() {
    try {
      console.log("ProjectSyncer: Initializing");
      const defaultSyncStatus = new SyncStatus({
        tableName: "Project",
        syncType: SyncKind.Complete,
        startTime: new Date(),
        asOfTime: new Date(),
      });
      const syncStatus = (await u.withDb((conn) => SyncStatus.load(conn, "Project"))) ?? defaultSyncStatus;
      console.log(`Status: ${SyncKind.asString(syncStatus.syncType)}`);
      if (syncStatus.syncType === SyncKind.Incremental) {
        if (syncStatus.asOfTime > new Date(Date.now() - 3 * 8.64e7)) {
          await this.#incrementalSync(syncStatus);
        } else {
          console.log("ProjectSyncer: last full sync too long ago, will start over");
          await u.withDb((conn) => defaultSyncStatus.save(conn));
          await this.#completeSync(defaultSyncStatus);
        }
      } else {
        await this.#completeSync(syncStatus);
      }

      console.log("ProjectSyncer: Finished (projects are now up to date)");
    } catch (ex) {
      console.error(`ProjectSyncer: Unexpected exception. Shutting down.\n${ex}\n${ex.stack}`);
    }
  }

  async #completeSync(syncStatus) {
    console.log("Starting cursor based sync.");
    for await (const [batch, cursor] of this.#client.projects({ after: syncStatus.syncValue })) {
      await u.withDb(async (conn) => {
        await this.#upsertProjects(conn, batch);
        syncStatus.syncValue = cursor;
        syncStatus.asOfTime = new Date();
        await syncStatus.save(conn);
      });
    }

    syncStatus.syncType = SyncKind.Incremental;
    syncStatus.syncValue = null;
    syncStatus.startTime = new Date();
    syncStatus.asOfTime = new Date();
    await u.withDb((conn) => syncStatus.save(conn));

    console.log("Full cursor sync completed.");
  }

  async #incrementalSync(syncStatus) {
    const modifiedAfter = new Date(syncStatus.startTime.valueOf() - 5 * 60 * 1000);
    console.log(`Syncing project changes after ${modifiedAfter}`);

    for await (const [batch, cursor] of this.#client.projects({
      after: syncStatus.syncValue,
      modifiedAfter: m.CET_DATETIME.toJson(modifiedAfter),
    })) {
      await u.withDb(async (conn) => {
        await this.#upsertProjects(conn, batch);
        syncStatus.syncValue = cursor;
        syncStatus.asOfTime = new Date();
        await syncStatus.save(conn);
      });
    }
    console.log("Finished syncing changes.");
  }

  async #upsertProjects(conn, projects) {
    console.log(`Processing batch of ${projects.length} projects.`);

    const projectIdForXledgerDbId = new Map();
    const objectValueIdForXledgerDbId = new Map();
    const tx = conn.beginTransaction();

    try {
      for (const project of projects) {
        console.log(`Processing project: ${project.dbId}`);
        const params = {
          ...Object.fromEntries(PROJECT_REF_FIELDS.concat(OBJECT_VALUE_REF_FIELDS).map((x) => [`${x}Id`, null])),
          xledgerDbId: project.dbId,
        };

        for (const projectRefField of PROJECT_REF_FIELDS) {
          if (typeof project[projectRefField] === "object" && project[projectRefField] !== null) {
            const xlDbId = project[projectRefField].dbId;
            if (xlDbId !== 0) {
              params[`${projectRefField}Id`] =
                projectIdForXledgerDbId.get(xlDbId) ?? (await this.#ensureProjectRecord(conn, xlDbId));
            }
          }
        }

        for (const objectValueRefField of OBJECT_VALUE_REF_FIELDS) {
          if (typeof project[objectValueRefField] === "object" && project[objectValueRefField] !== null) {
            const xlDbId = project[objectValueRefField].dbId;
            const code = project[objectValueRefField].code;
            if (xlDbId !== 0) {
              params[`${objectValueRefField}Id`] =
                objectValueIdForXledgerDbId.get(xlDbId) ?? (await this.#ensureObjectValueRecord(conn, xlDbId, code));
            }
          }
        }

        for (const [field, mapping] of Object.entries(FIELD_MAPPINGS)) {
          const raw = project[field];
          const val = raw === null || raw === undefined ? null : mapping.fromJson(raw);
          params[field] = val;
        }

        await conn.exec({
          sql: dbQueries.UPSERT_PROJECT,
          parameters: params,
          transaction: tx,
        });
      }
      tx.commit();
    } catch(ex) {
      tx.rollback();
      throw ex;
    }
  }

  async #ensureProjectRecord(conn, xlDbId) {
    const result = await conn.queryOne({
      sql: `
            insert into Project(xledgerDbId)
            values ($xledgerDbId)
            on conflict do nothing
            returning id
            `,
      parameters: { xledgerDbId: xlDbId },
    });

    if (typeof result.id === "number") {
      return result.id;
    }

    return await conn
      .queryOne({
        sql: `select id from Project where xledgerDbId = @xledgerDbId`,
        parameters: { xledgerDbId: xlDbId },
      })
      .then((x) => x.id);
  }

  async #ensureObjectValueRecord(conn, xlDbId, code) {
    const result = await conn.queryOne({
      sql: `
            insert into ObjectValue(xledgerDbId, code)
            values ($xledgerDbId, $code)
            on conflict do update
            set code = excluded.code
            returning id
            `,
      parameters: { xledgerDbId: xlDbId, code },
    });

    return result.id;
  }
}
