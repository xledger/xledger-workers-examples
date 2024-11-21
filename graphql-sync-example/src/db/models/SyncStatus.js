export const SyncKind = {
  None: Symbol("None"),
  Complete: Symbol("Complete"),
  Incremental: Symbol("Incremental"),
  ofString(s) {
    return SyncKind[s] ?? SyncKind.None;
  },
  asString(x) {
    return x.description;
  },
};

export default class SyncStatus {
  tableName;
  syncType;
  syncValue;
  startTime;
  asOfTime;

  constructor({ tableName, syncType, syncValue, startTime, asOfTime }) {
    this.tableName = tableName;
    this.syncType = syncType;
    this.syncValue = syncValue;
    this.startTime = startTime;
    this.asOfTime = asOfTime;
  }

  static async load(conn, tableName) {
    const result = await conn.queryOne({
      sql: `
            select tableName, syncType, syncValue, startTime, asOfTime
            from SyncStatus
            where tableName = $tableName
            `,
      parameters: { tableName },
    });

    return (
      result &&
      new SyncStatus({
        ...result,
        syncType: SyncKind.ofString(result.syncType),
        startTime: new Date(result.startTime),
        asOfTime: new Date(result.asOfTime),
      })
    );
  }

  async save(conn) {
    await conn.exec({
      sql: `
            INSERT INTO SyncStatus(tableName, syncType, syncValue, startTime, asOfTime)
            VALUES($tableName, $syncType, $syncValue, $startTime, $asOfTime)
            ON CONFLICT(tableName) DO
            UPDATE SET
            syncType = excluded.syncType
            ,syncValue = excluded.syncValue
            ,startTime = excluded.startTime
            ,asOfTime = excluded.asOfTime
            `,
      parameters: {
        tableName: this.tableName,
        syncType: SyncKind.asString(this.syncType),
        syncValue: this.syncValue ?? null,
        startTime: this.startTime.toISOString(),
        asOfTime: this.asOfTime.toISOString(),
      },
    });
  }
}
