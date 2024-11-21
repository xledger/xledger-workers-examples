export class DataError extends Error {
  #kind;
  #data;

  constructor(kind, data) {
    super(JSON.stringify(data));
    this.#kind = kind;
    this.#data = data;
  }

  get kind() {
    return this.#kind;
  }

  get data() {
    return this.#data;
  }
}

export function ErrorWithKind({ kinds, name }) {
  // hackery to give the class a name dynamically
  name ?? "DataError";
  return {
    [name]: class extends DataError {
      constructor(kind, data) {
        super(kind, data);
        if (kinds && !(kind in kinds)) {
          throw new Error("invalid kind");
        }
      }
    },
  }[name];
}
