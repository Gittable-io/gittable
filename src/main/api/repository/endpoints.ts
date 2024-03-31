import fs from "node:fs/promises";
import fsync from "node:fs";
import git, { GitProgressEvent, GitAuth } from "isomorphic-git";
import http from "isomorphic-git/http/node";

import type { Repository } from "@sharedTypes/index";

import {
  generateRepositoryId,
  getRepositoryNameFromRemoteUrl,
  getRepositoryPath,
} from "../../utils/utils";
import { UserDataStore } from "../../db";

export type CloneRepositoryParameters = {
  remoteUrl: string;
  credentials?: {
    username: string;
    password: string;
  };
};

export type CloneRepositoryResponse =
  | { status: "success"; type: "cloned"; repository: Repository }
  | { status: "success"; type: "already cloned"; repository: Repository }
  | { status: "error"; type: "malformed url"; message: string }
  | {
      status: "error";
      type: "auth required no credentials provided";
      message: "Authentication is required but no credentials were provided";
    }
  | { status: "error"; type: "connection error"; message: string }
  | {
      status: "error";
      type: "git user name & email not configured ";
      message: string;
    }
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
export async function clone_repository({
  remoteUrl,
  credentials,
}: CloneRepositoryParameters): Promise<CloneRepositoryResponse> {
  console.debug(`[API/clone_repository] Called with remoteUrl=${remoteUrl}`);

  const trimmedRemoteUrl = remoteUrl.trim();

  // First, check that the git config: user name and email are configured
  const gitConfig = await UserDataStore.getGitConfig();
  if (gitConfig.user.name.trim() === "" || gitConfig.user.email.trim() === "") {
    return {
      status: "error",
      type: "git user name & email not configured ",
      message: "Git user name and email are not configured",
    };
  }
  // Second, check that we didn't already clone this repository
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
    // Clone the repository
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
            type: "auth required no credentials provided",
            message:
              "Authentication is required but no credentials were provided",
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

    // Configure the user name and email
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
          type: "malformed url",
          message: "URL is not valid",
        };
      } else {
        errorResponse = {
          status: "error",
          type: "connection error",
          message: "Error connecting to Git repository",
        };
      }
    } else {
      errorResponse = {
        status: "error",
        type: "unknown",
        message: "Unknown error",
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
            type: "unknown",
            message: "Unknown error",
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
      message: "An error occured. Please contact support";
    }
  | {
      status: "error";
      type: "error deleting repository folder";
      message: "An error occured. Please contact support";
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
        message: "An error occured. Please contact support",
      };
    }
  } else {
    return {
      status: "error",
      type: "non-existing repository folder",
      message: "An error occured. Please contact support",
    };
  }
}
