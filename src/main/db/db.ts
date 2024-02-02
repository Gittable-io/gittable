import { Repository } from "@sharedTypes/index";
import fs from "node:fs/promises";
import fsync from "node:fs";
import { config } from "../config";

type UserData = {
  repositories: Repository[];
};

/*
I think the implementation of a simple JSON store for user data needs to be revised,
when I'm more experienced with javascript.
I hesitated, and I went with Class in a Singleton pattern as I felt at the time to be the
cleanest implementation. But I'm not sure.
It also needs much better safeguards for concurrency, file corruption and error handling.

But for now, it will do
*/
export class UserDataStore {
  private static instance: UserDataStore;
  private userData: UserData;

  private constructor() {
    if (fsync.existsSync(config.userDataFile)) {
      const userData = fsync.readFileSync(config.userDataFile, {
        encoding: "utf-8",
      });
      this.userData = JSON.parse(userData) as UserData;
    } else {
      console.debug("[db] There are no user data file. Initializing one");
      const newUserData = UserDataStore.initializeUserData();
      this.userData = newUserData;
      this.save();
    }
  }

  static getInstance(): UserDataStore {
    if (!UserDataStore.instance) {
      UserDataStore.instance = new UserDataStore();
    }
    return UserDataStore.instance;
  }

  // Method to get user data
  getUserData(): UserData {
    return this.userData;
  }

  // Methods to modify and save the user data back to the file
  // TODO: Add check that there's no existing repository with the same ID
  async addRepository(repository: Repository): Promise<void> {
    this.userData = {
      ...this.userData,
      repositories: [...this.userData.repositories, repository],
    };

    this.save();
  }

  // TODO: Add check that the repository exists
  async deleteRepository(repositoryId: string): Promise<void> {
    this.userData = {
      ...this.userData,
      repositories: this.userData.repositories.filter(
        (repo) => repo.id !== repositoryId,
      ),
    };

    this.save();
  }

  // TODO: investigate : should save() by sync or async? should it have an await?
  private async save(): Promise<void> {
    await fs.writeFile(
      config.userDataFile,
      JSON.stringify(this.userData, null, 2),
      {
        encoding: "utf-8",
      },
    );
  }

  private static initializeUserData(): UserData {
    return {
      repositories: [],
    };
  }
}
