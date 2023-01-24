export function createLogger(debug: boolean) {
  return {
    dbg(...msg: any[]) {
      if (debug) console.log("DBG", ...msg);
    },
    log(...msg: any[]) {
      console.log(...msg);
    },
    warn(...msg: any[]) {
      console.warn(...msg);
    },
    err(...msg: any[]) {
      console.error("ERROR:", ...msg);
    },
  };
}

export type Logger = ReturnType<typeof createLogger>;
