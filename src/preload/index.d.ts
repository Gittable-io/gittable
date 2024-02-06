import { ElectronAPI } from "@electron-toolkit/preload";
import { type GittableElectronAPI } from "../main/api";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: GittableElectronAPI;
  }
}
