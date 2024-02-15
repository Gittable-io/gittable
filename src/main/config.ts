import path from "node:path";
import { app } from "electron";

export type Config = {
  dir: {
    repositories: string;
  };
  userDataFile: string;
  fileExtensions: {
    table: string;
  };
};

/**
 * * Why didn't I just returned an object Config? Why return a function getConfig()?
 * * Because the config uses "app" from "electron", but it can't use it before the app is launched
 * * and we are in the context of the app (or else it throws an error)
 */
export const getConfig = (): Config => ({
  dir: {
    repositories: path.join(app.getPath("userData"), "repositories"),
  },
  userDataFile: path.join(app.getPath("userData"), "data.json"),
  fileExtensions: {
    table: ".table.json",
  },
});
