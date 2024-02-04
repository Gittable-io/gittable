import { ipcRenderer, ipcMain } from "electron";
import { Table } from "gittable-editor";
import { ping } from "./ping";
import {
  clone_repository,
  type CloneRepositoryResponse,
  list_repositories,
  type ListRepositoriesReponse,
  delete_repository,
  type DeleteRepositoryReponse,
} from "./repository";
import {
  get_table,
  post_table,
  list_tables,
  type ListTablesResponse,
} from "./table";

// Define the functions (API) that the renderer
// can call to communicate with the main process
interface IGittableElectronAPI {
  ping: () => Promise<string>;

  clone_repository: (remoteUrl: string) => Promise<CloneRepositoryResponse>;
  list_repositories: () => Promise<ListRepositoriesReponse>;
  delete_repository: (repositoryId: string) => Promise<DeleteRepositoryReponse>;

  list_tables: (repositoryId: string) => Promise<ListTablesResponse>;
  get_table: (path: string) => Promise<Table>; //TODO: Remove or modify to use git
  post_table: (path: string, table: Table) => Promise<void>; //TODO: Remove or modify to use git
}

const gittableElectronAPI: IGittableElectronAPI = {
  ping: (): Promise<string> => ipcRenderer.invoke("ping"),

  clone_repository: (remoteUrl: string): Promise<CloneRepositoryResponse> =>
    ipcRenderer.invoke("clone_repository", remoteUrl),
  list_repositories: (): Promise<ListRepositoriesReponse> =>
    ipcRenderer.invoke("list_repositories"),
  delete_repository: (repositoryId: string): Promise<DeleteRepositoryReponse> =>
    ipcRenderer.invoke("delete_repository", repositoryId),

  list_tables: (repositoryId: string): Promise<ListTablesResponse> =>
    ipcRenderer.invoke("list_tables", repositoryId),
  get_table: (path: string): Promise<Table> =>
    ipcRenderer.invoke("get_table", path), //TODO: Remove or modify to use git
  post_table: (path: string, table: Table): Promise<void> =>
    ipcRenderer.invoke("post_table", path, table), //TODO: Remove or modify to use git
};

// Map ipcRenderer.invoke(<channel>) to controller function
const addHandlesForGittableElectronAPICall = (): void => {
  ipcMain.handle("ping", ping);

  ipcMain.handle("clone_repository", (_event, remoteUrl) =>
    clone_repository(remoteUrl),
  );
  ipcMain.handle("list_repositories", list_repositories);
  ipcMain.handle("delete_repository", (_event, repositoryId) =>
    delete_repository(repositoryId),
  );

  ipcMain.handle("list_tables", (_event, repositoryId) =>
    list_tables(repositoryId),
  );
  ipcMain.handle("get_table", (_event, path) => get_table(path)); //TODO: Remove or modify to use git
  ipcMain.handle(
    "post_table",
    (_event, path, tableData) => post_table(path, tableData), //TODO: Remove or modify to use git
  );
};

export { gittableElectronAPI, addHandlesForGittableElectronAPICall };
export type { IGittableElectronAPI };
