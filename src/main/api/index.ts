import { ipcRenderer, ipcMain } from "electron";
import { Table } from "gittable-editor";
import { get_table } from "./table";
import { post_ping } from "./ping";

// Define the functions (API) that the renderer
// can call to communicate with the main process
interface IGittableElectronAPI {
  post_ping: () => Promise<string>;
  get_table: () => Promise<Table>;
}

const gittableElectronAPI: IGittableElectronAPI = {
  post_ping: (): Promise<string> => ipcRenderer.invoke("post_ping"),
  get_table: (): Promise<Table> => ipcRenderer.invoke("get_table"),
};

const addHandlesForGittableElectronAPICall = (): void => {
  ipcMain.handle("post_ping", post_ping);
  ipcMain.handle("get_table", get_table);
};

export { gittableElectronAPI, addHandlesForGittableElectronAPICall };
