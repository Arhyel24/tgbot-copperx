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
};
