import path from "node:path";

// The OS specific folder where app data should be saved. see : https://stackoverflow.com/a/26227660/471461
const OS_USER_DATA_FOLDER =
  process.env.APPDATA ||
  (process.platform == "darwin"
    ? process.env.HOME + "/Library/Preferences"
    : process.env.HOME + "/.local/share");

const APP_NAME = "gittable-repos";

const HOME_DIR = path.join(OS_USER_DATA_FOLDER, APP_NAME);

export const config = {
  dir: {
    home: HOME_DIR,
    repositories: path.join(HOME_DIR, "repositories"),
  },
};
