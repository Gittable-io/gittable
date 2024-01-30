import { ipcRenderer, ipcMain } from "electron";
import { Table } from "gittable-editor";
import { get_table, post_table } from "./table/";
import { post_ping } from "./ping";
import { clone_repository, type PostRepositoryResponse } from "./repository";

// Define the functions (API) that the renderer
// can call to communicate with the main process
interface IGittableElectronAPI {
  post_ping: () => Promise<string>;
  get_table: (path: string) => Promise<Table>; //TODO: Remove or modify to use git
  post_table: (path: string, table: Table) => Promise<void>; //TODO: Remove or modify to use git
  clone_repository: (remoteUrl: string) => Promise<PostRepositoryResponse>;
}

const gittableElectronAPI: IGittableElectronAPI = {
  post_ping: (): Promise<string> => ipcRenderer.invoke("post_ping"),
  get_table: (path: string): Promise<Table> =>
    ipcRenderer.invoke("get_table", path), //TODO: Remove or modify to use git
  post_table: (path: string, table: Table): Promise<void> =>
    ipcRenderer.invoke("post_table", path, table), //TODO: Remove or modify to use git
  clone_repository: (remoteUrl: string): Promise<PostRepositoryResponse> =>
    ipcRenderer.invoke("clone_repository", remoteUrl),
};

// Map ipcRenderer.invoke(<channel>) to controller function
const addHandlesForGittableElectronAPICall = (): void => {
  ipcMain.handle("post_ping", post_ping);
  ipcMain.handle("get_table", (_event, path) => get_table(path)); //TODO: Remove or modify to use git
  ipcMain.handle(
    "post_table",
    (_event, path, tableData) => post_table(path, tableData), //TODO: Remove or modify to use git
  );
  ipcMain.handle("clone_repository", (_event, remoteUrl) =>
    clone_repository(remoteUrl),
  );
};

export { gittableElectronAPI, addHandlesForGittableElectronAPICall };
export type { IGittableElectronAPI };
