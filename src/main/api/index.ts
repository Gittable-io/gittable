import { ipcRenderer, ipcMain } from "electron";

// Define the functions (API) that the renderer
// can call to communicate with the main process
interface IGittableElectronAPI {
  post_ping: () => Promise<string>;
}

const gittableElectronAPI: IGittableElectronAPI = {
  post_ping: (): Promise<string> => ipcRenderer.invoke("post_ping"),
};

const addHandlesForGittableElectronAPICall = (): void => {
  ipcMain.handle("post_ping", () => {
    console.log("Main: Received Ping from Renderer");
    return "pong";
  });
};

export { gittableElectronAPI, addHandlesForGittableElectronAPICall };
