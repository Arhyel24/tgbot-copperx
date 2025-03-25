const isDev = process.env.NODE_ENV === "development";
export const logger = {
    log: (...args) => {
        if (isDev) {
            console.log("[LOG]:", ...args);
        }
    },
    error: (...args) => {
        console.error("[ERROR]:", ...args);
    },
    warn: (...args) => {
        console.warn("[WARN]:", ...args);
    },
    info: (...args) => {
        if (isDev) {
            console.info("[INFO]:", ...args);
        }
    },
    debug: (...args) => {
        if (isDev) {
            console.debug("[DEBUG]:", ...args);
        }
    },
    table: (data) => {
        if (isDev) {
            console.table(data);
        }
    },
    trace: (...args) => {
        if (isDev) {
            console.trace("[TRACE]:", ...args);
        }
    },
    time: (label) => {
        if (isDev) {
            console.time(`[TIMER]: ${label}`);
        }
    },
    timeEnd: (label) => {
        if (isDev) {
            console.timeEnd(`[TIMER]: ${label}`);
        }
    },
    group: (label) => {
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
