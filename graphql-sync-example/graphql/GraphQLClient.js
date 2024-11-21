import { ErrorWithKind } from "../DataError.js";
import * as q from "./queries.js";
import * as u from "../util.js";

const GraphQLErrorKind = {
  Other: Symbol("Other"),
  ShortRateLimitReached: Symbol("ShortRateLimitReached"),
  InsufficientCredits: Symbol("InsufficientCredits"),
};

export class GraphQLError extends ErrorWithKind(GraphQLErrorKind) {}

export class GraphQLClient {
  #token;
  #endpoint;

  constructor(token, endpoint) {
    this.#token = token;
    this.#endpoint = endpoint;
  }

  async #query(query, variables) {
    const resp = await u.fetchJsonWithRetries(this.#endpoint, {
      body: JSON.stringify({ query, variables }),
      method: "POST",
      headers: {
        Authorization: `token ${this.#token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!resp) {
      throw new GraphQLErrorKind(GraphQLErrorKind.Other, "bad response");
    }

    for (const err of resp.errors ?? []) {
      switch (err.code) {
        case "BAD_REQUEST.BURST_RATE_LIMIT_REACHED":
          throw new GraphQLError(GraphQLErrorKind.ShortRateLimitReached, err);
        case "BAD_REQUEST.INSUFFICIENT_CREDITS":
          throw new GraphQLError(GraphQLErrorKind.InsufficientCredits, err);
        default:
          throw new GraphQLError(GraphQLErrorKind.Other, err);
      }
    }

    return resp.data;
  }

  async *projects({ after, modifiedAfter }) {
    let nextCursor = after;
    while (true) {
      const afterParam = nextCursor ? { after: nextCursor } : {};
      const projects =
        typeof modifiedAfter === "string"
          ? await this.#query(q.PROJECT_DELTAS, { ...afterParam, modifiedAfter }).then((x) => x.project_deltas)
          : await this.#query(q.PROJECTS, afterParam).then((x) => x.projects);
      const nodes = projects.edges?.map((x) => x.node) ?? [];

      nextCursor = projects.pageInfo.hasNextPage ? projects.edges.at(-1).cursor : null;
      yield [nodes, nextCursor];

      if (!nextCursor) {
        break;
      }
      await u.sleep(100);
    }
  }
}
