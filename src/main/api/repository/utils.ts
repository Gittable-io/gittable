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