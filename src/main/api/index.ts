import { ipcRenderer, ipcMain } from "electron";
import { Table } from "gittable-editor";
import { get_table, post_table } from "./table/";
import { post_ping } from "./ping";
import { git_clone, git_status, git_add, git_commit, git_push } from "./git";

// Define the functions (API) that the renderer
// can call to communicate with the main process
interface IGittableElectronAPI {
  post_ping: () => Promise<string>;
  get_table: (path: string) => Promise<Table>;
  post_table: (path: string, table: Table) => Promise<void>;
  git_clone: () => Promise<void>;
  git_status: () => Promise<void>;
  git_add: () => Promise<void>;
  git_commit: () => Promise<void>;
  git_push: () => Promise<void>;
}

const gittableElectronAPI: IGittableElectronAPI = {
  post_ping: (): Promise<string> => ipcRenderer.invoke("post_ping"),
  get_table: (path: string): Promise<Table> =>
    ipcRenderer.invoke("get_table", path),
  post_table: (path: string, table: Table): Promise<void> =>
    ipcRenderer.invoke("post_table", path, table),
  git_clone: (): Promise<void> => ipcRenderer.invoke("git_clone"),
  git_status: (): Promise<void> => ipcRenderer.invoke("git_status"),
  git_add: (): Promise<void> => ipcRenderer.invoke("git_add"),
  git_commit: (): Promise<void> => ipcRenderer.invoke("git_commit"),
  git_push: (): Promise<void> => ipcRenderer.invoke("git_push"),
};

// Map ipcRenderer.invoke(<channel>) to controller function
const addHandlesForGittableElectronAPICall = (): void => {
  ipcMain.handle("post_ping", post_ping);
  ipcMain.handle("get_table", (_event, path) => get_table(path));
  ipcMain.handle("post_table", (_event, path, tableData) =>
    post_table(path, tableData),
  );
  ipcMain.handle("git_clone", git_clone);
  ipcMain.handle("git_status", git_status);
  ipcMain.handle("git_add", git_add);
  ipcMain.handle("git_commit", git_commit);
  ipcMain.handle("git_push", git_push);
};

export { gittableElectronAPI, addHandlesForGittableElectronAPICall };
export type { IGittableElectronAPI };
