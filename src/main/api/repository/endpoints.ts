import fs from "node:fs/promises";
import fsync from "node:fs";
import path from "node:path";
import git, { GitProgressEvent, GitAuth } from "isomorphic-git";
import http from "isomorphic-git/http/node";

import { config } from "../../config";
import { getRepositoryId } from "../../utils";

export type CloneRepositoryResponse =
  | { status: "success"; type: "cloned" }
  | { status: "success"; type: "already cloned" }
  | { status: "error"; type: "malformed url"; message: string }
  | { status: "error"; type: "connection error"; message: string }
  | { status: "error"; type: "unknown"; message: string };

/**
 *
 * @param remoteUrl The URL of the remote repository
 *
 * clone_repository() does the following :
 * 1. Generates an ID from the repository URL (@see getRepositoryId for description on how the repository ID is generated)
 * 2. Determines the location on disk where the repository will be cloned to : <GITTABLE_HOME_DIR>/repositories/<repositoryId>
 * 3. Attempts to clone the repository
 *
 * The following events may happen:
 *
 * Repository already cloned:
 * => Return { status: "success"; type: "repository already cloned" }
 *
 * Successfull clone :
 * - The whole repository is cloned.
 * => Return { status: "success"; type: "cloned" }
 *
 * An error occured which may be due to
 *    - URL is not in the correct format
 *    => Return { status: "error"; type: "malformed url"; message: string }
 *    - Git couldn't connect to the remote server or the server returned a 404 or 401
 *    => Return { status: "error"; type: "connection error"; message: string }
 *    - An unknown error
 *    => Return { status: "error"; type: "unknown"; message: string }
 *
 */
export async function clone_repository(
  remoteUrl: string,
): Promise<CloneRepositoryResponse> {
  console.debug(`[API/clone_repository] Called with remoteUrl=${remoteUrl}`);

  const repositoryId = getRepositoryId(remoteUrl);
  const repositoryDir = path.join(config.dir.repositories, repositoryId);

  let response: CloneRepositoryResponse | null = null;

  // If repository is already cloned
  if (fsync.existsSync(repositoryDir)) {
    return { status: "success", type: "already cloned" };
  }

  //* it seems that the git.clone() creates the dir if it doesn't exist. So no need to create the folder beforehand
  try {
    await git.clone({
      fs,
      http,
      dir: repositoryDir,
      url: remoteUrl,
      onMessage: (message: string) => {
        console.log(`onMessage: ${message}`);
      },
      onProgress: (progress: GitProgressEvent) =>
        console.log(`onProgress: ${JSON.stringify(progress)}`),
      onAuth: (url: string, auth: GitAuth) =>
        console.log(`onAuth: url=${url}, auth=${JSON.stringify(auth)}`),
      onAuthFailure: (url: string, auth: GitAuth) =>
        console.log(`onAuthFailure: url=${url}, auth=${JSON.stringify(auth)}`),
      onAuthSuccess: (url: string, auth: GitAuth) =>
        console.log(`onAuthFailure: url=${url}, auth=${JSON.stringify(auth)}`),
    });
  } catch (error) {
    if (error instanceof Error) {
      console.debug(
        `[API/clone_repository] error.name=${error.name}, error.message=${error.message}`,
      );

      if (error.name === "UrlParseError") {
        response = {
          status: "error",
          type: "malformed url",
          message: "URL is not valid",
        };
      } else {
        response = {
          status: "error",
          type: "connection error",
          message: "Error connecting to Git repository",
        };
      }
    } else {
      response = {
        status: "error",
        type: "unknown",
        message: "Unknown error",
      };
    }
  } finally {
    // If there was an error, delete the repository folder that was created by git.clone()
    if (response) {
      // If I used fs.rm({force:true}) (force:true silences exceptions if folder doesn't exist), I would not need to check if folder exist,
      // but it seems that force:true have different behavior in each OS (see https://github.com/nodejs/node/issues/45253)
      console.debug(
        `[API/clone_repository] Following an error, clean any folder that was created`,
      );
      if (fsync.existsSync(repositoryDir)) {
        try {
          await fs.rm(repositoryDir, { recursive: true });
        } catch (error) {
          response = {
            status: "error",
            type: "unknown",
            message: "Unknown error",
          };
        }
      }
    }
  }

  if (response === null) {
    response = { status: "success", type: "cloned" };
    console.debug(
      `[API/clone_repository] Finished cloning in ${repositoryDir}`,
    );
  }

  return response;
}
