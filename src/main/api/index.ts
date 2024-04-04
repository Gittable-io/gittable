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
  discard_changes,
  type DiscardChangesParameters,
  type DiscardChangesResponse,
  get_repository_status,
  type GetRepositoryStatusParameters,
  type GetRepositoryStatusResponse,
  commit,
  type CommitParameters,
  type CommitResponse,
  get_history,
  type GetHistoryParameters,
  type GetHistoryResponse,
  push,
  type PushParameters,
  type PushResponse,
} from "./table";
import {
  get_git_config,
  type GetGitConfigReponse,
  save_git_config,
  type SaveGitConfigParameters,
  type SaveGitConfigResponse,
} from "./user";

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
  discard_changes: (
    params: DiscardChangesParameters,
  ): Promise<DiscardChangesResponse> =>
    ipcRenderer.invoke("discard_changes", params),
  get_repository_status: (
    params: GetRepositoryStatusParameters,
  ): Promise<GetRepositoryStatusResponse> =>
    ipcRenderer.invoke("get_repository_status", params),
  commit: (params: CommitParameters): Promise<CommitResponse> =>
    ipcRenderer.invoke("commit", params),
  get_history: (params: GetHistoryParameters): Promise<GetHistoryResponse> =>
    ipcRenderer.invoke("get_history", params),
  push: (params: PushParameters): Promise<PushResponse> =>
    ipcRenderer.invoke("push", params),

  get_git_config: (): Promise<GetGitConfigReponse> =>
    ipcRenderer.invoke("get_git_config"),
  save_git_config: (
    params: SaveGitConfigParameters,
  ): Promise<SaveGitConfigResponse> =>
    ipcRenderer.invoke("save_git_config", params),
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
  ipcMain.handle("discard_changes", (_event, params) =>
    discard_changes(params),
  );
  ipcMain.handle("get_repository_status", (_event, params) =>
    get_repository_status(params),
  );
  ipcMain.handle("commit", (_event, params) => commit(params));
  ipcMain.handle("get_history", (_event, params) => get_history(params));
  ipcMain.handle("push", (_event, params) => push(params));

  ipcMain.handle("get_git_config", get_git_config);
  ipcMain.handle("save_git_config", (_event, params) =>
    save_git_config(params),
  );
};

export { gittableElectronAPI, addHandlesForGittableElectronAPICall };
export type { GittableElectronAPI };
