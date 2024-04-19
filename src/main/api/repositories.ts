import fs from "node:fs/promises";
import fsync from "node:fs";
import git from "isomorphic-git";
import http from "isomorphic-git/http/node";

import type {
  Repository,
  RepositoryCredentials,
  Version,
} from "@sharedTypes/index";

import {
  generateRepositoryId,
  getRepositoryNameFromRemoteUrl,
  getRepositoryPath,
} from "../utils/utils";
import { UserDataStore } from "../db";
import { switch_version } from "./repository";
import * as gitService from "../services/git/local";

//#region API: clone_repository
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
  console.debug(`[API/clone_repository] Check that git user is configured`);
  const gitConfig = await UserDataStore.getGitConfig();
  if (gitConfig.user.name.trim() === "" || gitConfig.user.email.trim() === "") {
    console.debug(`[API/clone_repository] Git user is not configured`);
    return {
      status: "error",
      type: "GIT_USER_NOT_CONFIGURED",
    };
  }
  // 2. Check that we didn't already clone this repository
  console.debug(
    `[API/clone_repository] Check that repository doesn't already exist`,
  );
  const repositories = await UserDataStore.getRepositories();
  const existingRepository = repositories.find(
    (repo) => repo.remoteUrl === trimmedRemoteUrl,
  );
  if (existingRepository) {
    console.debug(`[API/clone_repository] Repository already exists`);
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
    console.debug(`[API/clone_repository] Start cloning`);
    await git.clone({
      fs,
      http,
      dir: repositoryPath,
      url: remoteUrl,
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
      onAuthFailure: () => {
        console.debug(`[API/clone_repository] Authentication failure`);
      },
      onAuthSuccess: () => {
        console.debug(`[API/clone_repository] Authentication success`);
      },
    });

    // 4. Configure the local Git repo : user name and email
    console.debug(
      `[API/clone_repository] Configure the git local user name and email`,
    );
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

     if repository is intialized
      - 5.1 : Create a local branch for every draft branch
        - Why? When cloning a remote repo, by default, git creates a local branch "main" that tracks "origin/main", but it does not create a local branch for other remotes branches
        - However, to detect versions, our app only looks at local branches
        - We correct this by creating a local branch for every draft remote branch other than main

      - 5.2 : Checkout to either: the last published version (tag) or the draft version if there's no published version
        - Why? When cloning a remote repo, by default, HEAD points to main.
        - However, we do not allow HEAD to point to main. We only allow it to point to a draft/ branch or a tag on main
        - We correct this by making HEAD point to the latest published tag or to a draft branch

      Note : if repository is not initialized we don't do nothing, as we should wait the user to initialize the repo
    */
    const isRepositoryInitialized = await gitService.isRepositoryInitialized({
      repositoryId,
    });
    console.debug(
      `[API/clone_repository] Repository is ${isRepositoryInitialized ? "" : "not "}initialized`,
    );
    if (isRepositoryInitialized) {
      console.debug(
        `[API/clone_repository] Preparing repository to be usable (repo is already initialized)`,
      );

      // 5.1 For every remote draft branch: create a local draft branch that tracks the remote branch
      const remoteBranches = await git.listBranches({
        fs,
        dir: repositoryPath,
        remote: "origin",
      });

      for (const remoteBranch of remoteBranches) {
        if (remoteBranch.startsWith("draft/")) {
          /*
         * - If I just create a local branch of the same name, it won't work, as isogit (or git) doesn't automatically set it to track the remote branch of the same name
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

      // 5.2 : Checkout the last published version (tag) or draft

      let versionToSwitchTo: Version | null =
        await gitService.getLastPublishedVersion({
          repositoryId,
        });
      if (!versionToSwitchTo) {
        const draftVersions = await gitService.getDraftVersions({
          repositoryId,
        });
        versionToSwitchTo = draftVersions[0];
      }
      if (!versionToSwitchTo) {
        errorResponse = {
          status: "error",
          type: "COULD_NOT_SWITCH_TO_LATEST_PUBLISHED_VERSION",
        };
      } else {
        const switchResp = await switch_version({
          repositoryId,
          version: versionToSwitchTo,
        });
        if (switchResp.status === "error")
          errorResponse = {
            status: "error",
            type: "COULD_NOT_SWITCH_TO_LATEST_PUBLISHED_VERSION",
          };
      }
    }
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

//#endregion

//#region API: list_repositories
export type ListRepositoriesReponse = {
  status: "success";
  repositories: Repository[];
};

export async function list_repositories(): Promise<ListRepositoriesReponse> {
  console.debug(`[API/list_repositories] Called`);

  const repositories = await UserDataStore.getRepositories();
  return { status: "success", repositories: repositories };
}
//#endregion

//#region API: delete_repository
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
//#endregion
