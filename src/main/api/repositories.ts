import fs from "node:fs/promises";
import fsync from "node:fs";
import git, { GitProgressEvent, GitAuth } from "isomorphic-git";
import http from "isomorphic-git/http/node";

import type { Repository, RepositoryCredentials } from "@sharedTypes/index";

import {
  generateRepositoryId,
  getRepositoryNameFromRemoteUrl,
  getRepositoryPath,
} from "../utils/utils";
import { UserDataStore } from "../db";
import { get_last_published_version, switch_version } from "./repository";

export type CloneRepositoryParameters = {
  remoteUrl: string;
  credentials?: RepositoryCredentials;
};

export type CloneRepositoryResponse =
  | { status: "success"; type: "cloned"; repository: Repository }
  | { status: "success"; type: "already cloned"; repository: Repository }
  | {
      status: "error";
      type:
        | "MALFORMED_URL"
        | "AUTH_REQUIRED_NO_CREDENTIALS_PROVIDED"
        | "CONNECTION_ERROR"
        | "GIT_USER_NOT_CONFIGURED"
        | "COULD_NOT_SWITCH_TO_LATEST_PUBLISHED_VERSION"
        | "UNKNOWN";
    };

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
export async function clone_repository({
  remoteUrl,
  credentials,
}: CloneRepositoryParameters): Promise<CloneRepositoryResponse> {
  console.debug(`[API/clone_repository] Called with remoteUrl=${remoteUrl}`);

  const trimmedRemoteUrl = remoteUrl.trim();

  // 1. check that the git config: user name and email are configured
  const gitConfig = await UserDataStore.getGitConfig();
  if (gitConfig.user.name.trim() === "" || gitConfig.user.email.trim() === "") {
    return {
      status: "error",
      type: "GIT_USER_NOT_CONFIGURED",
    };
  }
  // 2. Check that we didn't already clone this repository
  const repositories = await UserDataStore.getRepositories();
  const existingRepository = repositories.find(
    (repo) => repo.remoteUrl === trimmedRemoteUrl,
  );
  if (existingRepository) {
    return {
      status: "success",
      type: "already cloned",
      repository: existingRepository,
    };
  }

  // This is a repository that we never cloned. Let's go!
  const repositoryId = generateRepositoryId(remoteUrl);
  const repositoryPath = getRepositoryPath(repositoryId);

  let errorResponse: CloneRepositoryResponse | null = null;

  //* it seems that the git.clone() creates the dir if it doesn't exist. So we don't need to create the folder beforehand
  try {
    // 3. Clone the repository
    await git.clone({
      fs,
      http,
      dir: repositoryPath,
      url: remoteUrl,
      onMessage: (message: string) => {
        console.log(`onMessage: ${message}`);
      },
      onProgress: (progress: GitProgressEvent) =>
        console.log(`onProgress: ${JSON.stringify(progress)}`),
      onAuth: () => {
        console.debug(`[API/clone_repository] onAuth callback called`);
        if (!credentials) {
          errorResponse = {
            status: "error",
            type: "AUTH_REQUIRED_NO_CREDENTIALS_PROVIDED",
          };
          return { cancel: true };
        } else {
          return {
            username: credentials.username,
            password: credentials.password,
          };
        }
      },
      onAuthFailure: (url: string, auth: GitAuth) =>
        console.log(`onAuthFailure: url=${url}, auth=${JSON.stringify(auth)}`),
      onAuthSuccess: (url: string, auth: GitAuth) =>
        console.log(`onAuthFailure: url=${url}, auth=${JSON.stringify(auth)}`),
    });

    // 4. Configure the user name and email
    await git.setConfig({
      fs,
      dir: repositoryPath,
      path: "user.name",
      value: gitConfig.user.name,
    });
    await git.setConfig({
      fs,
      dir: repositoryPath,
      path: "user.email",
      value: gitConfig.user.email,
    });

    /*
     5. Now that the repository is cloned, There's some steps to make our local repository usable

      - 5.1 : Create a local branch for every draft branch
        - Why? When cloning a remote repo, by default, git creates a local branch "main" that tracks "origin/main", but it does not create a local branch for other remotes branches
        - However, to detect versions, our app only looks at local branches
        - We correct this by creating a local branch for every draft remote branch other than main

      - 5.2 : Checkout the last published version (tag)
        - Why? When cloning a remote repo, by default, HEAD points to main.
        - However, we do not allow HEAD to point to main. We only allow it to point to a draft/ branch or a tag on main
        - We correct this by making HEAD point to the latest published tag
        TODO: need to change this when cloning an empty repository
    */

    // 5.1 For every remote draft branch: create a local draft branch that tracks the remote branch
    const remoteBranches = await git.listBranches({
      fs,
      dir: repositoryPath,
      remote: "origin",
    });

    for (const remoteBranch of remoteBranches) {
      if (remoteBranch.startsWith("draft/")) {
        /*
         * - If I just create a local branch of the same name, it won't work, as isomorphic-git (or git) doesn't automatically set it to track the remote branch of the same name
         * - isogit doesn't have a command like git branch --set-upstream-to=<remote branch> that allows me to create a local branch and set its upstream branch
         * - The solution I found is to checkout the branch, and here isogit will automatically create the local branch correctly set its upstream branch
         *
         TODO: For the future : Modify isogit and to add a --set-upstream-to option
         */
        await git.checkout({
          fs,
          dir: getRepositoryPath(repositoryId),
          ref: remoteBranch,
        });
      }
    }

    // 5.2 : Checkout the last published version (tag)
    const lastPublishedVersion = await get_last_published_version({
      repositoryId,
    });
    const switchResp = await switch_version({
      repositoryId,
      version: lastPublishedVersion,
    });
    if (switchResp.status === "error")
      errorResponse = {
        status: "error",
        type: "COULD_NOT_SWITCH_TO_LATEST_PUBLISHED_VERSION",
      };
  } catch (error) {
    if (error instanceof Error) {
      console.debug(
        `[API/clone_repository] error.name=${error.name}, error.message=${error.message}`,
      );

      if (error.name === "UserCanceledError") {
        // I canceled the operation myself, and the response is already set
      } else if (error.name === "UrlParseError") {
        errorResponse = {
          status: "error",
          type: "MALFORMED_URL",
        };
      } else {
        errorResponse = {
          status: "error",
          type: "CONNECTION_ERROR",
        };
      }
    } else {
      errorResponse = {
        status: "error",
        type: "UNKNOWN",
      };
    }
  } finally {
    // If there was an error, delete the repository folder that was created by git.clone()
    if (errorResponse) {
      // If I used fs.rm({force:true}) (force:true silences exceptions if folder doesn't exist), I would not need to check if folder exist,
      // but it seems that force:true have different behavior in each OS (see https://github.com/nodejs/node/issues/45253)
      console.debug(
        `[API/clone_repository] Following an error, clean any folder that was created`,
      );
      if (fsync.existsSync(repositoryPath)) {
        try {
          await fs.rm(repositoryPath, { recursive: true });
        } catch (error) {
          errorResponse = {
            status: "error",
            type: "UNKNOWN",
          };
        }
      }
    }
  }

  if (errorResponse == null) {
    // If cloning was a success
    // 1. Save the repository in user data
    const newRepository = {
      id: repositoryId,
      remoteUrl: trimmedRemoteUrl,
      name: getRepositoryNameFromRemoteUrl(remoteUrl),
    };
    if (credentials) {
      await UserDataStore.addRepository(newRepository, credentials);
    } else {
      await UserDataStore.addRepository(newRepository);
    }

    // 2. Send the response
    const successResponse: CloneRepositoryResponse = {
      status: "success",
      type: "cloned",
      repository: newRepository,
    };
    console.debug(`[API/clone_repository] Finished cloning in ${repositoryId}`);
    return successResponse;
  } else {
    return errorResponse;
  }
}

export type ListRepositoriesReponse = {
  status: "success";
  repositories: Repository[];
};

export async function list_repositories(): Promise<ListRepositoriesReponse> {
  console.debug(`[API/list_repositories] Called`);

  const repositories = await UserDataStore.getRepositories();
  return { status: "success", repositories: repositories };
}

export type DeleteRepositoryParameters = {
  repositoryId: string;
};

export type DeleteRepositoryReponse =
  | {
      status: "success";
    }
  | {
      status: "error";
      type: "non-existing repository folder";
    }
  | {
      status: "error";
      type: "error deleting repository folder";
    };

export async function delete_repository({
  repositoryId,
}: DeleteRepositoryParameters): Promise<DeleteRepositoryReponse> {
  console.debug(
    `[API/delete_repository] Called with repositoryId=${repositoryId}`,
  );

  const repositoryPath = getRepositoryPath(repositoryId);

  // TODO: Deleting a repository folder is used in this endpoint and in clone_repository(). Consider extracting it
  if (fsync.existsSync(repositoryPath)) {
    try {
      // Delete repository folder
      await fs.rm(repositoryPath, { recursive: true });

      // Remove repository entry from user data
      await UserDataStore.deleteRepository(repositoryId);
      return {
        status: "success",
      };
    } catch (error) {
      return {
        status: "error",
        type: "error deleting repository folder",
      };
    }
  } else {
    return {
      status: "error",
      type: "non-existing repository folder",
    };
  }
}
