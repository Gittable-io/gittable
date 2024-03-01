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
 * @returns the path to the table file
 */
export const getTablePath = (repositoryId: string, tableId: string): string => {
  const repositoryPath = getRepositoryPath(repositoryId);
  return path.join(repositoryPath, tableId);
};

/**
 *
 * @param tableFileName the Table file name. ex: `srs.table.json`
 * @returns the Table name, which is the file name without the extension. ex: `srs`
 */
export const getTableNameFromFileName = (tableFileName: string): string => {
  const tableFileExtension = getConfig().fileExtensions.table;

  if (tableFileName.endsWith(tableFileExtension)) {
    return tableFileName.slice(
      0,
      tableFileName.length - tableFileExtension.length,
    );
  } else return tableFileName;
};

export const getTableFileNameFromId = (tableId: string): string => {
  return tableId;
};
