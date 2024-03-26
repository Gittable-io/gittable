import { Repository } from "@sharedTypes/index";
import fs from "node:fs/promises";
import { getConfig } from "../config";

export type UserData = {
  repositories: Repository[];
  git: {
    user: {
      name: string;
      email: string;
    };
  };
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

  // Get user data
  static async getUserData(): Promise<UserData> {
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
  static async getRepository(repositoryId: string): Promise<Repository> {
    const userData = await UserDataStore.getUserData();

    const repository = userData.repositories.find(
      (repo) => repo.id === repositoryId,
    );

    if (repository) return repository;
    else throw new Error(`There's no repository with id : ${repositoryId}`);
  }

  static async addRepository(repository: Repository): Promise<void> {
    const userData = await UserDataStore.getUserData();

    // If a repository with the same ID already exists, throw an error
    if (userData.repositories.some((repo) => repo.id === repository.id)) {
      throw new Error(
        `You are trying to add a new repository, but there's already a repository with the id: ${repository.id}`,
      );
    }

    const newUserData = {
      ...userData,
      repositories: [...userData.repositories, repository],
    };

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

    const newUserData = {
      ...userData,
      repositories: userData.repositories.filter(
        (repo) => repo.id !== repositoryId,
      ),
    };

    await UserDataStore.save(newUserData);
  }
  //#endregion

  //#region git config
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
