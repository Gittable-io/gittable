/**
 *
 * @param remoteUrl
 * @returns a repository ID that will be used throughout the application
 */
export const getRepositoryId = (remoteUrl: string): string => {
  const remotUrlWithoutProtocol = remoteUrl.replace(/(^\w+:|^)\/\//, "");
  const repositoryId = remotUrlWithoutProtocol.replace(/[:\\/?*<>|]/g, "_");
  return repositoryId;
};
