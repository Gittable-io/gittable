import { ipcRenderer, ipcMain } from "electron";
import { ping, type PingResponse } from "./ping";
import {
  get_git_config,
  type GetGitConfigReponse,
  save_git_config,
  type SaveGitConfigParameters,
  type SaveGitConfigResponse,
} from "./user";
import {
  clone_repository,
  type CloneRepositoryParameters,
  type CloneRepositoryResponse,
  list_repositories,
  type ListRepositoriesReponse,
  delete_repository,
  type DeleteRepositoryParameters,
  type DeleteRepositoryReponse,
} from "./repositories";
import {
  get_repository_status,
  type GetRepositoryStatusParameters,
  type GetRepositoryStatusResponse,
  list_versions,
  type ListVersionsParameters,
  type ListVersionsResponse,
  switch_version,
  type SwitchVersionParameters,
  type SwitchVersionResponse,
  create_draft,
  type CreateDraftParameters,
  type CreateDraftResponse,
  delete_draft,
  type DeleteDraftParameters,
  type DeleteDraftResponse,
} from "./repository";
import {
  get_current_version,
  type GetCurrentVersionParameters,
  type GetCurrentVersionResponse,
  get_current_version_content,
  type GetCurrentVersionContentParameters,
  type GetCurrentVersionContentResponse,
  discard_changes,
  type DiscardChangesParameters,
  type DiscardChangesResponse,
  commit,
  type CommitParameters,
  type CommitResponse,
  push_commits,
  type PushCommitsParameters,
  type PushCommitsResponse,
} from "./version";
import {
  get_table_data,
  type GetTableParameters,
  type GetTableResponse,
  save_table,
  type SaveTableParameters,
  type SaveTableResponse,
} from "./table";

/**
 * TODO: I was able to remove boilerplate when adding or modifying an endpoint. But there's room for improvement
 * I struggled a bit with Typescript generics over functions so I abandon otimizing further
 */

// Define the API functions that the Renderer can call
// Each API function result in an ipcRenderer.invoke()
const gittableElectronAPI = {
  // ping API
  ping: (): Promise<PingResponse> => ipcRenderer.invoke("ping"),

  // user API
  get_git_config: (): Promise<GetGitConfigReponse> =>
    ipcRenderer.invoke("get_git_config"),
  save_git_config: (
    params: SaveGitConfigParameters,
  ): Promise<SaveGitConfigResponse> =>
    ipcRenderer.invoke("save_git_config", params),

  // repositories API
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

  // repository API
  get_repository_status: (
    params: GetRepositoryStatusParameters,
  ): Promise<GetRepositoryStatusResponse> =>
    ipcRenderer.invoke("get_repository_status", params),
  list_versions: (
    params: ListVersionsParameters,
  ): Promise<ListVersionsResponse> =>
    ipcRenderer.invoke("list_versions", params),
  get_current_version: (
    params: GetCurrentVersionParameters,
  ): Promise<GetCurrentVersionResponse> =>
    ipcRenderer.invoke("get_current_version", params),
  switch_version: (
    params: SwitchVersionParameters,
  ): Promise<SwitchVersionResponse> =>
    ipcRenderer.invoke("switch_version", params),
  create_draft: (params: CreateDraftParameters): Promise<CreateDraftResponse> =>
    ipcRenderer.invoke("create_draft", params),
  delete_draft: (params: DeleteDraftParameters): Promise<DeleteDraftResponse> =>
    ipcRenderer.invoke("delete_draft", params),

  // version API
  get_current_version_content: (
    params: GetCurrentVersionContentParameters,
  ): Promise<GetCurrentVersionContentResponse> =>
    ipcRenderer.invoke("get_current_version_content", params),
  discard_changes: (
    params: DiscardChangesParameters,
  ): Promise<DiscardChangesResponse> =>
    ipcRenderer.invoke("discard_changes", params),
  commit: (params: CommitParameters): Promise<CommitResponse> =>
    ipcRenderer.invoke("commit", params),
  push_commits: (params: PushCommitsParameters): Promise<PushCommitsResponse> =>
    ipcRenderer.invoke("push_commits", params),

  // table API
  get_table_data: (params: GetTableParameters): Promise<GetTableResponse> =>
    ipcRenderer.invoke("get_table_data", params),
  save_table: (params: SaveTableParameters): Promise<SaveTableResponse> =>
    ipcRenderer.invoke("save_table", params),
};

type GittableElectronAPI = typeof gittableElectronAPI;

// When Renderer calls an API endpoint, Main should map it to the corresponding function in /api
const addHandlesForGittableElectronAPICall = (): void => {
  // ping API
  ipcMain.handle("ping", ping);

  // user API
  ipcMain.handle("get_git_config", get_git_config);
  ipcMain.handle("save_git_config", (_event, params) =>
    save_git_config(params),
  );

  // repositories API
  ipcMain.handle("clone_repository", (_event, params) =>
    clone_repository(params),
  );
  ipcMain.handle("list_repositories", list_repositories);
  ipcMain.handle("delete_repository", (_event, params) =>
    delete_repository(params),
  );

  // repository API
  ipcMain.handle("get_repository_status", (_event, params) =>
    get_repository_status(params),
  );
  ipcMain.handle("list_versions", (_event, params) => list_versions(params));
  ipcMain.handle("get_current_version", (_event, params) =>
    get_current_version(params),
  );
  ipcMain.handle("switch_version", (_event, params) => switch_version(params));
  ipcMain.handle("create_draft", (_event, params) => create_draft(params));
  ipcMain.handle("delete_draft", (_event, params) => delete_draft(params));

  // version API
  ipcMain.handle("get_current_version_content", (_event, params) =>
    get_current_version_content(params),
  );
  ipcMain.handle("discard_changes", (_event, params) =>
    discard_changes(params),
  );
  ipcMain.handle("commit", (_event, params) => commit(params));
  ipcMain.handle("push_commits", (_event, params) => push_commits(params));

  // table API
  ipcMain.handle("get_table_data", (_event, params) => get_table_data(params));
  ipcMain.handle("save_table", (_event, params) => save_table(params));
};

export { gittableElectronAPI, addHandlesForGittableElectronAPICall };
export type { GittableElectronAPI };
