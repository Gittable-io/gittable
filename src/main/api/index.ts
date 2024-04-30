import { ipcRenderer, ipcMain } from "electron";
import { ping, type PingResponse, test } from "./ping";
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
  init_repository,
  type InitRepositoryParameters,
  type InitRepositoryResponse,
  list_versions,
  type ListVersionsParameters,
  type ListVersionsResponse,
  get_current_version,
  type GetCurrentVersionParameters,
  type GetCurrentVersionResponse,
  switch_version,
  type SwitchVersionParameters,
  type SwitchVersionResponse,
  create_draft,
  type CreateDraftParameters,
  type CreateDraftResponse,
  delete_draft,
  type DeleteDraftParameters,
  type DeleteDraftResponse,
  compare_versions,
  type CompareVersionsParameters,
  type CompareVersionsResponse,
  publish_draft,
  type PublishDraftParameters,
  type PublishDraftResponse,
  pull,
  type PullParameters,
  type PullResponse,
  get_remote_info,
  type GetRemoteInfoParameters,
  type GetRemoteInfoResponse,
} from "./repository";
import {
  pull_new_draft,
  type PullNewDraftParameters,
  type PullNewDraftResponse,
  pull_new_commits,
  type PullNewCommitsParameters,
  type PullNewCommitsResponse,
} from "./repository_pull";
import {
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
  add_table,
  type AddTableParameters,
  type AddTableResponse,
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
  test: (): Promise<void> => ipcRenderer.invoke("test"),

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
  init_repository: (
    params: InitRepositoryParameters,
  ): Promise<InitRepositoryResponse> =>
    ipcRenderer.invoke("init_repository", params),
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
  compare_versions: (
    params: CompareVersionsParameters,
  ): Promise<CompareVersionsResponse> =>
    ipcRenderer.invoke("compare_versions", params),
  publish_draft: (
    params: PublishDraftParameters,
  ): Promise<PublishDraftResponse> =>
    ipcRenderer.invoke("publish_draft", params),
  pull: (params: PullParameters): Promise<PullResponse> =>
    ipcRenderer.invoke("pull", params),
  get_remote_info: (
    params: GetRemoteInfoParameters,
  ): Promise<GetRemoteInfoResponse> =>
    ipcRenderer.invoke("get_remote_info", params),

  // repository_pull API
  pull_new_draft: (
    params: PullNewDraftParameters,
  ): Promise<PullNewDraftResponse> =>
    ipcRenderer.invoke("pull_new_draft", params),
  pull_new_commits: (
    params: PullNewCommitsParameters,
  ): Promise<PullNewCommitsResponse> =>
    ipcRenderer.invoke("pull_new_commits", params),

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
  add_table: (params: AddTableParameters): Promise<AddTableResponse> =>
    ipcRenderer.invoke("add_table", params),
};

type GittableElectronAPI = typeof gittableElectronAPI;

// When Renderer calls an API endpoint, Main should map it to the corresponding function in /api
const addHandlesForGittableElectronAPICall = (): void => {
  // ping API
  ipcMain.handle("ping", ping);
  ipcMain.handle("test", test);

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
  ipcMain.handle("init_repository", (_event, params) =>
    init_repository(params),
  );
  ipcMain.handle("list_versions", (_event, params) => list_versions(params));
  ipcMain.handle("get_current_version", (_event, params) =>
    get_current_version(params),
  );
  ipcMain.handle("switch_version", (_event, params) => switch_version(params));
  ipcMain.handle("create_draft", (_event, params) => create_draft(params));
  ipcMain.handle("delete_draft", (_event, params) => delete_draft(params));
  ipcMain.handle("compare_versions", (_event, params) =>
    compare_versions(params),
  );
  ipcMain.handle("publish_draft", (_event, params) => publish_draft(params));
  ipcMain.handle("pull", (_event, params) => pull(params));
  ipcMain.handle("get_remote_info", (_event, params) =>
    get_remote_info(params),
  );

  // repository_pull API
  ipcMain.handle("pull_new_draft", (_event, params) => pull_new_draft(params));
  ipcMain.handle("pull_new_commits", (_event, params) =>
    pull_new_commits(params),
  );

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
  ipcMain.handle("add_table", (_event, params) => add_table(params));
};

export { gittableElectronAPI, addHandlesForGittableElectronAPICall };
export type { GittableElectronAPI };
