import { ReadCommitResult } from "isomorphic-git";

export type Repository = {
  id: string;
  name: string;
  remoteUrl: string;
};

// TODO: REMOVE WHEN REDESIGN IS OVER
export type RepositoryStatus = {
  currentBranch: {
    name: string;
    localHeadCommitOid: string;
    remoteHeadCommitOid: string;
    isAheadOfRemote: boolean;
  };
  tables: TableStatus[];
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
// TODO: REMOVE WHEN REDESIGN IS OVER
export type TableStatus = TableMetadata & { modified: boolean };

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
};

export type Version = PublishedVersion | DraftVersion;

export type VersionContent = {
  tables: TableMetadataWithStatus[];
  commits: ReadCommitResult[];
};
