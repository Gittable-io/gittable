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
  get_table_data,
  type GetTableResponse,
  save_table,
  type SaveTableResponse,
  list_tables,
  type ListTablesResponse,
} from "./table";

//TODO: Create types EndpointParameters (like for Endpoint Response), so I don't have to change this file when I change parameters

// Define the functions (API) that the renderer
// can call to communicate with the main process
interface IGittableElectronAPI {
  ping: () => Promise<string>;

  clone_repository: (remoteUrl: string) => Promise<CloneRepositoryResponse>;
  list_repositories: () => Promise<ListRepositoriesReponse>;
  delete_repository: (repositoryId: string) => Promise<DeleteRepositoryReponse>;

  list_tables: (repositoryId: string) => Promise<ListTablesResponse>;
  get_table_data: (
    repositoryId: string,
    tableId: string,
  ) => Promise<GetTableResponse>;
  save_table: (
    repositoryId: string,
    tableId: string,
    table: Table,
  ) => Promise<SaveTableResponse>;
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
  get_table_data: (
    repositoryId: string,
    tableId: string,
  ): Promise<GetTableResponse> =>
    ipcRenderer.invoke("get_table_data", repositoryId, tableId),
  save_table: (
    repositoryId: string,
    tableId: string,
    table: Table,
  ): Promise<SaveTableResponse> =>
    ipcRenderer.invoke("save_table", repositoryId, tableId, table),
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
  ipcMain.handle("get_table_data", (_event, repositoryId, tableId) =>
    get_table_data(repositoryId, tableId),
  );
  ipcMain.handle("save_table", (_event, repositoryId, tableId, table) =>
    save_table(repositoryId, tableId, table),
  );
};

export { gittableElectronAPI, addHandlesForGittableElectronAPICall };
export type { IGittableElectronAPI };
