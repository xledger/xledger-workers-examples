const RETRY_LIMIT = 18;

export function sleep(ms) {
  return new Promise((resolve, _reject) => setTimeout(resolve, ms));
}

export async function fetchJsonWithRetries(...args) {
  for (let trial = 1; trial <= RETRY_LIMIT; trial++) {
    const r = await globalThis.fetch(...args);
    if (r.status === 529 || r.status >= 500) {
      await sleep(trial * trial * 5);
      continue;
    }
    return r.json();
  }
}

export async function withDb(f) {
  const conn = await sqlite.open();
  try {
    return await Promise.resolve(f(conn));
  } finally {
    conn.close();
  }
}

export function now() {
  return new Date();
}
