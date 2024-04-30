export type Repository = {
  id: string;
  name: string;
  remoteUrl: string;
};

export type RepositoryStatus =
  | "NOT_INITIALIZED"
  | "DRAFT_ONLY"
  | "HAS_PUBLISHED";

export type RepositoryCredentials = {
  username: string;
  password: string;
};

export type DocumentChangeType = "none" | "modified" | "added" | "deleted";

/**
 * Represent information (metadata) about a Table without the table data itself
 */
export type TableMetadata = {
  /** The ID of the table, which corresponds currently to the table file name as saved on the fs */
  id: string;
  /** The name of the table, which corresponds currently to the ID (or filename) without the .table.json extension */
  name: string;
};

export type TableMetadataWithStatus = TableMetadata & {
  change: DocumentChangeType;
};

export type PublishedVersion = {
  type: "published";
  name: string; // For now, name and tag are the same
  tag: string;
  newest: boolean;
  mainCommitOid: string;
};

export type DraftVersion = {
  type: "draft";
  id: string;
  name: string;
  branch: string;
  headOid: string;
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
  change: DocumentChangeType;
}[];

// Used as I may not have all the properties of a Draft Version that only exists on remote
export type RemoteDraftVersion = Pick<
  DraftVersion,
  "type" | "id" | "name" | "branch" | "headOid"
>;

export type RemoteRepositoryChanges = {
  newDraft?: {
    draftVersion: RemoteDraftVersion;
  };
  newCommits?: {
    version: DraftVersion;
  };
  deletedDraft?: {
    version: DraftVersion;
  };
  newPublishedVersions?: {
    version: Pick<PublishedVersion, "type" | "name" | "tag" | "mainCommitOid">;
  }[];
};
