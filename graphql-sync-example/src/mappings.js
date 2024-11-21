const DEFAULT = {
  fromJson(x) {
    return x;
  },
  toJson(x) {
    return x;
  },
  fromDb(x) {
    return x;
  },
  toDb(x) {
    return x;
  },
};

export default {
  STRING: DEFAULT,
  BOOLEAN: {
    ...DEFAULT,
    fromDb(x) {
      return !!x;
    },
    toDb(x) {
      return x ? 1 : 0;
    },
  },
  INT: DEFAULT,
  INT64_STRING: {
    ...DEFAULT,
    fromJson(x) {
      return parseInt(x, 10);
    },
    toJson(x) {
      return x.toString();
    },
  },
  FLOAT: DEFAULT,
  MONEY_STRING: {
    ...DEFAULT,
    toDb(x) {
      parseFloat(x);
    },
    fromDb(x) {
      // do we need more decimals?  not sure what the max for any currency is
      x.toFixed(2);
    },
  },
  DATE: {
    fromJson(x) {
      return new Date(Date.parse(x));
    },
    toJson(x) {
      return x.toISOString().split("T")[0];
    },
    fromDb(x) {
      return this.fromJson(x);
    },
    toDb(x) {
      return this.toJson(x);
    },
  },
  CET_DATETIME: {
    fromJson(x) {
      return new Date(Date.parse(`${x}+01:00`));
    },
    toJson(x) {
      return new Date(x.valueOf() - 1000 * 60 * 60).toISOString().split(".")[0];
    },
    fromDb(x) {
      return this.fromJson(x);
    },
    toDb(x) {
      return this.toJson(x);
    },
  },
};
