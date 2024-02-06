import { ipcRenderer, ipcMain } from "electron";
import { ping, type PingResponse } from "./ping";
import {
  clone_repository,
  type CloneRepositoryParameters,
  type CloneRepositoryResponse,
  list_repositories,
  type ListRepositoriesReponse,
  delete_repository,
  type DeleteRepositoryParameters,
  type DeleteRepositoryReponse,
  add_file,
  type AddFileParameters,
  type AddFileResponse,
  commit,
  type CommitParameters,
  type CommitResponse,
  push,
  type PushParameters,
  type PushResponse,
} from "./repository";
import {
  get_table_data,
  type GetTableParameters,
  type GetTableResponse,
  save_table,
  type SaveTableParameters,
  type SaveTableResponse,
  list_tables,
  type ListTablesParameters,
  type ListTablesResponse,
} from "./table";

/**
 * TODO: I was able to remove boilerplate when adding or modifying an endpoint. But there's room for improvement
 * I struggled a bit with Typescript generics over functions so I abandon otimizing further
 */

// Define the API functions that the Renderer can call
// Each API function result in an ipcRenderer.invoke()
const gittableElectronAPI = {
  ping: (): Promise<PingResponse> => ipcRenderer.invoke("ping"),

  clone_repository: (
    params: CloneRepositoryParameters,
  ): Promise<CloneRepositoryResponse> =>
    ipcRenderer.invoke("clone_repository", params),
  list_repositories: (): Promise<ListRepositoriesReponse> =>
    ipcRenderer.invoke("list_repositories"),
  delete_repository: (
    params: DeleteRepositoryParameters,
  ): Promise<DeleteRepositoryReponse> =>
    ipcRenderer.invoke("delete_repository", params),

  list_tables: (params: ListTablesParameters): Promise<ListTablesResponse> =>
    ipcRenderer.invoke("list_tables", params),
  get_table_data: (params: GetTableParameters): Promise<GetTableResponse> =>
    ipcRenderer.invoke("get_table_data", params),
  save_table: (params: SaveTableParameters): Promise<SaveTableResponse> =>
    ipcRenderer.invoke("save_table", params),

  add_file: (params: AddFileParameters): Promise<AddFileResponse> =>
    ipcRenderer.invoke("add_file", params),
  commit: (params: CommitParameters): Promise<CommitResponse> =>
    ipcRenderer.invoke("commit", params),
  push: (params: PushParameters): Promise<PushResponse> =>
    ipcRenderer.invoke("push", params),
};

type GittableElectronAPI = typeof gittableElectronAPI;

// When Renderer calls an API endpoint, Main should map it to the corresponding function in /api
const addHandlesForGittableElectronAPICall = (): void => {
  ipcMain.handle("ping", ping);

  ipcMain.handle("clone_repository", (_event, params) =>
    clone_repository(params),
  );
  ipcMain.handle("list_repositories", list_repositories);
  ipcMain.handle("delete_repository", (_event, params) =>
    delete_repository(params),
  );

  ipcMain.handle("list_tables", (_event, params) => list_tables(params));
  ipcMain.handle("get_table_data", (_event, params) => get_table_data(params));
  ipcMain.handle("save_table", (_event, params) => save_table(params));

  ipcMain.handle("add_file", (_event, params) => add_file(params));
  ipcMain.handle("commit", (_event, params) => commit(params));
  ipcMain.handle("push", (_event, params) => push(params));
};

export { gittableElectronAPI, addHandlesForGittableElectronAPICall };
export type { GittableElectronAPI };
