const isDev = process.env.NODE_ENV === "development";

export const logger = {
  log: (...args: any[]) => {
    if (isDev) {
      console.log("[LOG]:", ...args);
    }
  },
  error: (...args: any[]) => {
    console.error("[ERROR]:", ...args);
  },
  warn: (...args: any[]) => {
    console.warn("[WARN]:", ...args);
  },
  info: (...args: any[]) => {
    if (isDev) {
      console.info("[INFO]:", ...args);
    }
  },
  debug: (...args: any[]) => {
    if (isDev) {
      console.debug("[DEBUG]:", ...args);
    }
  },
  table: (data: any) => {
    if (isDev) {
      console.table(data);
    }
  },
  trace: (...args: any[]) => {
    if (isDev) {
      console.trace("[TRACE]:", ...args);
    }
  },
  time: (label: string) => {
    if (isDev) {
      console.time(`[TIMER]: ${label}`);
    }
  },
  timeEnd: (label: string) => {
    if (isDev) {
      console.timeEnd(`[TIMER]: ${label}`);
    }
  },
  group: (label: string) => {
    if (isDev) {
      console.group(`[GROUP]: ${label}`);
    }
  },
  groupEnd: () => {
    if (isDev) {
      console.groupEnd();
    }
  },
};
