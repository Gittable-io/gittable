import { ElectronAPI } from "@electron-toolkit/preload";
import { IGittableElectronAPI } from "./main/api";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: IGittableElectronAPI;
  }
}
