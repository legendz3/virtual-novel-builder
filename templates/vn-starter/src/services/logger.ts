import { env } from "@app/env";
export const logger = {
  debug: (...details: unknown[]): void => {
    if (env.debug) console.debug(...details);
  },
  info: (...details: unknown[]): void => {
    if (env.debug) console.info(...details);
  },
  warn: (...details: unknown[]): void => {
    if (env.debug) console.warn(...details);
  },
  error: (...details: unknown[]): void => {
    if (env.debug) console.error(...details);
  },
};
