export type Repository = {
  id: string;
  name: string;
  remoteUrl: string;
};

export type RepositoryStatus = {
  isEmpty: boolean;
  isInitial: boolean;
};

export type RepositoryCredentials = {
  username: string;
  password: string;
};

/**
 * Represent information (metadata) about a Table without the table data itself
 */
export type TableMetadata = {
  /** The ID of the table, which corresponds currently to the table file name as saved on the fs */
  id: string;
  /** The name of the table, which corresponds currently to the ID (or filename) without the .table.json extension */
  name: string;
};

export type TableMetadataWithStatus = TableMetadata & { modified: boolean };

export type PublishedVersion = {
  type: "published";
  name: string;
  tag: string;
  newest: boolean;
};

export type DraftVersion = {
  type: "draft";
  name: string;
  branch: string;
  baseOid: string;
  basePublishedVersion: PublishedVersion | "INITIAL";
};

export type Version = PublishedVersion | DraftVersion;

export type Commit = {
  oid: string;
  message: string;
  author: {
    name: string;
    email: string;
    timestamp: number;
    timezoneOffset: number;
  };

  inRemote: boolean;
};

export type VersionContent = {
  tables: TableMetadataWithStatus[];
  commits: Commit[];
};

export type VersionContentComparison = {
  table: TableMetadata;
  diff: "none" | "modified" | "added" | "deleted";
}[];
