import { type Table } from "gittable-editor";

export type Repository = {
  id: string;
  name: string;
  remoteUrl: string;
};

export type TableMetadata = {
  id: string;
  name: string;
};

export type TableWithMetadata = TableMetadata & {
  tableData: Table;
};
