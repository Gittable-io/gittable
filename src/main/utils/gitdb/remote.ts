import fs from "node:fs/promises";
import git, { FetchResult, PushResult } from "isomorphic-git";
import http from "isomorphic-git/http/node";
import { RepositoryCredentials } from "@sharedTypes/index";
import { UserDataStore } from "../../db";
import { getRepositoryPath } from "../utils";

export class NoCredentialsProvidedError extends Error {
  constructor() {
    super("NoCredentialsProvidedError"); // To set the message
    this.name = "NoCredentialsProvidedError";
    Object.setPrototypeOf(this, NoCredentialsProvidedError.prototype);
  }
}

export class AuthWithProvidedCredentialsError extends Error {
  constructor() {
    super("AuthWithProvidedCredentialsError"); // To set the message
    this.name = "AuthWithProvidedCredentialsError";
    Object.setPrototypeOf(this, AuthWithProvidedCredentialsError.prototype);
  }
}

export class UnknownPushError extends Error {
  constructor(message?: string) {
    super(`UnknownPushError: ${message}`); // To set the message
    this.name = "UnknownPushError";
    Object.setPrototypeOf(this, UnknownPushError.prototype);
  }
}

export async function pushBranchOrTag({
  repositoryId,
  branchOrTagName,
  credentials: providedCredentials,
  deleteBranch = false,
}: {
  repositoryId: string;
  branchOrTagName: string;
  credentials?: RepositoryCredentials;
  deleteBranch?: boolean;
}): Promise<void> {
  // Retrieve credentials, and return error if there are no credentials
  const credentials =
    providedCredentials ??
    (await UserDataStore.getRepositoryCredentials(repositoryId));
  if (credentials == null) {
    throw new NoCredentialsProvidedError();
  }

  let pushResult: PushResult | null = null;
  try {
    // Push branch
    pushResult = await git.push({
      fs,
      http,
      dir: getRepositoryPath(repositoryId),
      ref: branchOrTagName,
      delete: deleteBranch,
      onAuth: () => {
        return credentials;
      },
      onAuthFailure: () => {
        return { cancel: true };
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "UserCanceledError") {
        // This only occurs when I cancelled push with onAuthFailure
        throw new AuthWithProvidedCredentialsError();
      } else {
        throw new UnknownPushError(`${error.name}: ${error.message}`);
      }
    } else {
      throw new UnknownPushError();
    }
  }

  // After Push finished, check if there was an error
  if (!pushResult || pushResult.error) {
    throw new UnknownPushError("Push succeeded but with errors");
  }

  // Push was successfull
  // If credentials were provided, then save those credentials
  if (providedCredentials) {
    await UserDataStore.setRepositoryCredentials(
      repositoryId,
      providedCredentials,
    );
  }
  return;
}

export async function fetch({
  repositoryId,
  credentials: providedCredentials,
}: {
  repositoryId: string;
  credentials?: RepositoryCredentials;
}): Promise<FetchResult> {
  // Retrieve credentials, and return error if there are no credentials
  const credentials =
    providedCredentials ??
    (await UserDataStore.getRepositoryCredentials(repositoryId));
  if (credentials == null) {
    throw new NoCredentialsProvidedError();
  }

  let fetchResult: FetchResult | null = null;

  try {
    // Push branch
    fetchResult = await git.fetch({
      fs,
      http,
      dir: getRepositoryPath(repositoryId),
      onAuth: () => {
        return credentials;
      },
      onAuthFailure: () => {
        return { cancel: true };
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "UserCanceledError") {
        // This only occurs when I cancelled push with onAuthFailure
        throw new AuthWithProvidedCredentialsError();
      } else {
        throw new UnknownPushError(`${error.name}: ${error.message}`);
      }
    } else {
      throw new UnknownPushError();
    }
  }

  // Fetch was successfull
  // If credentials were provided, then save those credentials
  if (providedCredentials) {
    await UserDataStore.setRepositoryCredentials(
      repositoryId,
      providedCredentials,
    );
  }

  return fetchResult;
}
