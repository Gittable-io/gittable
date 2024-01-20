import { ipcRenderer, ipcMain } from "electron";
import { Table } from "gittable-editor";
import { get_table } from "./table";
import { post_ping } from "./ping";

// Define the functions (API) that the renderer
// can call to communicate with the main process
interface IGittableElectronAPI {
  post_ping: () => Promise<string>;
  get_table: (path: string) => Promise<Table>;
}

const gittableElectronAPI: IGittableElectronAPI = {
  post_ping: (): Promise<string> => ipcRenderer.invoke("post_ping"),
  get_table: (path: string): Promise<Table> =>
    ipcRenderer.invoke("get_table", path),
};

// Map ipcRenderer.invoke(<channel>) to controller function
const addHandlesForGittableElectronAPICall = (): void => {
  ipcMain.handle("post_ping", post_ping);
  ipcMain.handle("get_table", (event, path) => get_table(path));
};

export { gittableElectronAPI, addHandlesForGittableElectronAPICall };
