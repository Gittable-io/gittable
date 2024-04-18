import path from "node:path";
import { getConfig } from "../config";

/**
 *
 * @param remoteUrl
 * @returns
 */
export const getRepositoryNameFromRemoteUrl = (remoteUrl: string): string => {
  // Exemple : remoteUrl = "http://www.githost.com/user/repo.git"

  // parts = ["http:","","www.githost.com","user","repo.git"]
  const parts = remoteUrl.trim().split("/");

  // nameAndExtension = "repo.git"
  // note, take into account that a url can end in /
  const repoNameAndExtension =
    parts[parts.length - 1].length > 0
      ? parts[parts.length - 1]
      : parts[parts.length - 2];

  // name = "repo"
  const repoName = repoNameAndExtension.endsWith(".git")
    ? repoNameAndExtension.replace(".git", "")
    : repoNameAndExtension;

  // Sanitize the name as it will become a folder
  const sanitizedRepoName = repoName.replace(/(^\w+:|^)\/\//, "");

  return sanitizedRepoName;
};

export const generateRepositoryId = (remoteUrl: string): string => {
  const timestamp = Date.now().toString();
  const id = `${timestamp}_${getRepositoryNameFromRemoteUrl(remoteUrl)}`;

  return id;
};

export const getRepositoryPath = (repositoryId: string): string => {
  return path.join(getConfig().dir.repositories, repositoryId);
};

/**
 *
 * @param repositoryId
 * @param tableId
 * @returns the absolute path to the table file
 */
export const getAbsoluteTablePath = (
  repositoryId: string,
  tableId: string,
): string => {
  const repositoryPath = getRepositoryPath(repositoryId);
  const tableFileName = `${tableId}${getConfig().fileExtensions.table}`;
  return path.join(repositoryPath, tableFileName);
};

export const getRepositoryRelativeTablePath = (tableId: string): string => {
  /**
   * Since currently :
   * - Table ID = table file name
   * - We do not support folders in repositories : all tables are in the repository root folder, just return tableId
   */
  const tableFileName = `${tableId}${getConfig().fileExtensions.table}`;
  return tableFileName;
};

/**
 *
 * @param tableFileName the Table file name. ex: `srs.table.json`
 * @returns the Table name, which is the file name without the extension. ex: `srs`
 */
export const getTableIdFromFileName = (tableFileName: string): string => {
  const tableFileExtension = getConfig().fileExtensions.table;

  if (
    !tableFileName.endsWith(tableFileExtension) ||
    tableFileName === tableFileExtension
  ) {
    throw new Error(`${tableFileName} is not a table`);
  }

  return tableFileName.slice(
    0,
    tableFileName.length - tableFileExtension.length,
  );
};
