import fs from "node:fs/promises";
import path from "node:path";
import git from "isomorphic-git";
import http from "isomorphic-git/http/node";

import { config } from "../../config";
import { getRepositoryId } from "../../utils";

export type PostRepositoryResponse = string;

/*
- If RemoteUrl is already cloned and available => Return 200 OK and the repository information
- If RemoteUrl is not already cloned => return a 202 

*/
export async function clone_repository(
  remoteUrl: string,
): Promise<PostRepositoryResponse> {
  console.debug(`[API/clone_repository] Called with remoteUrl=${remoteUrl}`);

  const repositoryId = getRepositoryId(remoteUrl);
  const repositoryDir = path.join(config.dir.repositories, repositoryId);

  //* it seems that the git.clone() creates the dir if it doesn't exist. So no need to create the folder beforehand
  await git.clone({
    fs,
    http,
    dir: repositoryDir,
    url: remoteUrl,
  });

  console.debug(`[API/clone_repository] Finished cloning in ${repositoryDir}`);
  return "success";
}
