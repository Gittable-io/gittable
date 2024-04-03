import { Repository } from "@sharedTypes/index";
import fs from "node:fs/promises";
import { getConfig } from "../config";
import { produce } from "immer";
import { safeStorage } from "electron";

export type RepositoryCredentials = {
  username: string;
  password: string;
};

export type GitConfig = {
  user: { name: string; email: string };
};

export type UserData = {
  repositories: Repository[];
  credentials: { [key: string]: RepositoryCredentials };
  git: GitConfig;
};

/*
I think the implementation of a simple JSON store for user data needs to be revised,
when I'm more experienced with javascript.


I hesitated, at first I went with a Class in a Singleton pattern as I felt at the time to be the
cleanest implementation.
And then, I changed it to use just static methods (I fetch the data from file system at each read or write)
Maybe I don't need class here. Just an object with functions properties

It also needs much better safeguards for concurrency, file corruption and error handling.

But for now, it will do

TODO: Read the above comment
*/
export class UserDataStore {
  /* Private methods with access to file system*/
  private static initializeUserData(): UserData {
    return {
      repositories: [],
      credentials: {},
      git: {
        user: {
          name: "",
          email: "",
        },
      },
    };
  }

  private static async userDataFileExists(): Promise<boolean> {
    try {
      // fs.access() throws an error if file does not exists. see (https://nodejs.org/api/fs.html#fsaccesspath-mode-callback)
      await fs.access(getConfig().userDataFile, fs.constants.F_OK);
      return true;
    } catch (error) {
      if (error instanceof Error) {
        return false;
      } else {
        throw error;
      }
    }
  }

  private static async fetchUserData(): Promise<UserData> {
    const userDataJson = await fs.readFile(getConfig().userDataFile, {
      encoding: "utf-8",
    });
    const userData = JSON.parse(userDataJson) as UserData;
    return userData;
  }

  private static async save(userData: UserData): Promise<void> {
    await fs.writeFile(
      getConfig().userDataFile,
      JSON.stringify(userData, null, 2),
      {
        encoding: "utf-8",
      },
    );
  }

  private static async getUserData(): Promise<UserData> {
    if (await UserDataStore.userDataFileExists()) {
      const userData = await UserDataStore.fetchUserData();
      return userData;
    } else {
      console.debug("[db] There are no user data file. Initializing one");
      const newUserData = UserDataStore.initializeUserData();
      const userData = newUserData;
      await UserDataStore.save(userData);
      return userData;
    }
  }

  //#region repositories
  static async getRepositories(): Promise<Repository[]> {
    const userData = await UserDataStore.getUserData();
    return userData.repositories;
  }

  static async getRepository(repositoryId: string): Promise<Repository> {
    const userData = await UserDataStore.getUserData();

    const repository = userData.repositories.find(
      (repo) => repo.id === repositoryId,
    );

    if (repository) return repository;
    else throw new Error(`There's no repository with id : ${repositoryId}`);
  }

  /**
   *
   * @param repositoryId
   * @returns the decrypted credentials of the repository, null if there are no credentials
   */
  static async getRepositoryCredentials(
    repositoryId: string,
  ): Promise<RepositoryCredentials | null> {
    const userData = await UserDataStore.getUserData();

    const repository = userData.repositories.find(
      (repo) => repo.id === repositoryId,
    );

    if (repository) {
      if (repositoryId in userData.credentials) {
        const encryptedCredentials = userData.credentials[repositoryId];
        const decryptedCredentials: RepositoryCredentials = {
          username: safeStorage.decryptString(
            Buffer.from(encryptedCredentials.username, "base64"),
          ),
          password: safeStorage.decryptString(
            Buffer.from(encryptedCredentials.password, "base64"),
          ),
        };
        return decryptedCredentials;
      } else {
        return null;
      }
    } else throw new Error(`There's no repository with id : ${repositoryId}`);
  }

  static async addRepository(
    repository: Repository,
    credentials?: RepositoryCredentials,
  ): Promise<void> {
    const userData = await UserDataStore.getUserData();

    // If a repository with the same ID already exists, throw an error
    if (userData.repositories.some((repo) => repo.id === repository.id)) {
      throw new Error(
        `You are trying to add a new repository, but there's already a repository with the id: ${repository.id}`,
      );
    }

    const newUserData = produce(userData, (draft) => {
      draft.repositories.push(repository);
      if (credentials) {
        const encryptedCredentials: RepositoryCredentials = {
          username: safeStorage
            .encryptString(credentials.username)
            .toString("base64"),
          password: safeStorage
            .encryptString(credentials.password)
            .toString("base64"),
        };

        draft.credentials[repository.id] = encryptedCredentials;
      }
    });

    await UserDataStore.save(newUserData);
  }

  static async deleteRepository(repositoryId: string): Promise<void> {
    const userData = await UserDataStore.getUserData();

    // If there's no repository with that ID, throw an error
    if (!userData.repositories.some((repo) => repo.id === repositoryId)) {
      throw new Error(
        `You are trying to delete a repository, but there's no repository with the id: ${repositoryId}`,
      );
    }

    const newUserData = produce(userData, (draft) => {
      draft.repositories = draft.repositories.filter(
        (repo) => repo.id !== repositoryId,
      );
      delete draft.credentials[repositoryId];
    });

    await UserDataStore.save(newUserData);
  }
  //#endregion

  //#region git config
  static async getGitConfig(): Promise<GitConfig> {
    const userData = await UserDataStore.getUserData();
    return userData.git;
  }

  static async setGitUserConfig(name: string, email: string): Promise<void> {
    const userData = await UserDataStore.getUserData();

    const newUserData = {
      ...userData,
      git: {
        user: {
          name,
          email,
        },
      },
    };

    await UserDataStore.save(newUserData);
  }

  //#endregion
}
