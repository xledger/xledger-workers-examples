import { ProjectSyncer } from "./graphql/ProjectSyncer.js";
import { GraphQLClient } from "./graphql/GraphQLClient.js";
import * as u from "./util.js";
import * as dbQueries from "./db/queries.js";

const URL = "https://master.xlabs.com/graphql";

async function run(env) {
  await u.withDb((conn) => conn.exec({ sql: dbQueries.ENSURE_SCHEMA }));
  const client = new GraphQLClient(env.GRAPHQL_TOKEN, URL);
  const syncer = new ProjectSyncer(client);
  await syncer.run();
}

export default {
  async scheduled(_event, env, _ctx) {
    await run(env);
  },
  async fetch(_request, env, _ctx) {
    await run(env);
  },
};
