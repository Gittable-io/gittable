/* eslint-disable @typescript-eslint/no-explicit-any */
// I Disabled warning on using any, to be able to mock private methods

import { Repository } from "@sharedTypes/index";
import { UserDataStore, type UserData, RepositoryCredentials } from "./db";

/**
 * @param initialUserData: the userData that is "present" on the file system
 * If it is null, then there's no file present.
 *
 * This function mocks the 3 private methods of UserDataStore :
 * - userDataFileExists()
 * - fetchUserData()
 * - save()
 *
 */
const mockUserDataStoreFs = (initialUserData: UserData | null = null): void => {
  // The mocked "fs"
  const fs = { userData: initialUserData };

  jest
    .spyOn(UserDataStore as any, "userDataFileExists")
    .mockImplementation(() => {
      return fs.userData !== null;
    });

  // Note: it was a bit akward to mock with Jest and Typescript.
  // TODO: read about Jest mokcing and Typescript, and maybe rewrite this mock code below to make it more readable
  jest
    .spyOn(UserDataStore as any, "save")
    .mockImplementation((...args: unknown[]) => {
      const userData = args[0] as UserData;
      fs.userData = userData;
    });

  jest.spyOn(UserDataStore as any, "fetchUserData").mockImplementation(() => {
    return fs.userData;
  });
};

jest.mock("electron", () => {
  const originalModule = jest.requireActual("electron");
  return {
    ...originalModule,
    safeStorage: {
      encryptString: jest.fn((text) => Buffer.from(text, "base64")),
      decryptString: jest.fn((buffer) => buffer.toString("base64")),
    },
  };
});

describe("Test UserDataStore", () => {
  const gitConfig = { user: { name: "Mary", email: "mary@exemple.com" } };

  const mockRepository1 = {
    id: "1706889976_myrepo1",
    name: "myrepo1",
    remoteUrl: "http://gitserver.com/user/myrepo1.git",
  };

  const mockRepository2 = {
    id: "1706953975_myrepo2",
    name: "myrepo2",
    remoteUrl: "http://gitserver.com/user/myrepo2.git",
  };

  const mockUserData_0repo: UserData = {
    repositories: [],
    credentials: {},
    git: gitConfig,
  };

  const mockUserData_1repo: UserData = {
    repositories: [mockRepository1],
    credentials: {},
    git: gitConfig,
  };

  const mockUserData_1repo_credentials: UserData = {
    repositories: [mockRepository1],
    credentials: { [mockRepository1.id]: { username: "uuu", password: "ppp" } },
    git: gitConfig,
  };

  const mockUserData_2repo: UserData = {
    repositories: [mockRepository1, mockRepository2],
    credentials: {},
    git: gitConfig,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Test user data file doesn't exist", async () => {
    mockUserDataStoreFs(null);

    const userData = await UserDataStore.getGitConfig();
    expect(userData).toEqual({
      user: { name: "", email: "" },
    });
  });

  test("Add repository to an empty repository list", async () => {
    mockUserDataStoreFs(mockUserData_0repo);

    const newRepository: Repository = {
      id: "1706892481_myrepo2",
      name: "myrepo2",
      remoteUrl: "http://gitserver.com/user/myrepo2.git",
    };
    await UserDataStore.addRepository(newRepository);

    const repositories = await UserDataStore.getRepositories();

    expect(repositories).toHaveLength(1);
    expect(repositories[0]).toEqual(newRepository);
  });

  test("Add a repository to a non-empty repository list", async () => {
    mockUserDataStoreFs(mockUserData_1repo);

    const newRepository: Repository = {
      id: "1706892481_myrepo2",
      name: "myrepo2",
      remoteUrl: "http://gitserver.com/user/myrepo2.git",
    };
    await UserDataStore.addRepository(newRepository);

    const repositories = await UserDataStore.getRepositories();
    expect(repositories).toHaveLength(2);
    expect(repositories).toContainEqual(mockRepository1);
    expect(repositories).toContainEqual(newRepository);
  });

  test("Add a repository with credentials", async () => {
    mockUserDataStoreFs(mockUserData_1repo);

    const newRepository: Repository = {
      id: "1706892481_myrepo2",
      name: "myrepo2",
      remoteUrl: "http://gitserver.com/user/myrepo2.git",
    };
    const newCredentials: RepositoryCredentials = {
      username: "username",
      password: "password",
    };

    await UserDataStore.addRepository(newRepository, newCredentials);

    const repositories = await UserDataStore.getRepositories();
    expect(repositories).toHaveLength(2);
    expect(repositories).toContainEqual(mockRepository1);
    expect(repositories).toContainEqual(newRepository);

    const repositoryCredentials =
      await UserDataStore.getRepositoryCredentials("1706892481_myrepo2");
    expect(repositoryCredentials).toEqual(newCredentials);
  });

  test("Add a repository without credentials", async () => {
    mockUserDataStoreFs(mockUserData_1repo);

    const newRepository: Repository = {
      id: "1706892481_myrepo2",
      name: "myrepo2",
      remoteUrl: "http://gitserver.com/user/myrepo2.git",
    };

    await UserDataStore.addRepository(newRepository);

    const repositories = await UserDataStore.getRepositories();
    expect(repositories).toHaveLength(2);
    expect(repositories).toContainEqual(mockRepository1);
    expect(repositories).toContainEqual(newRepository);

    const repositoryCredentials =
      await UserDataStore.getRepositoryCredentials("1706892481_myrepo2");
    expect(repositoryCredentials).toBeNull();
  });

  test("Adding an existing repository throws an error", async () => {
    mockUserDataStoreFs(mockUserData_1repo);

    const mockRepository1_copy = {
      id: "1706889976_myrepo1",
      name: "myrepo1",
      remoteUrl: "http://gitserver.com/user/myrepo1.git",
    };

    await expect(
      UserDataStore.addRepository(mockRepository1_copy),
    ).rejects.toThrow(Error);
  });

  test("Delete an existing repository", async () => {
    mockUserDataStoreFs(mockUserData_2repo);

    await UserDataStore.deleteRepository("1706889976_myrepo1");

    const repositories = await UserDataStore.getRepositories();
    expect(repositories).toHaveLength(1);
    expect(repositories).toContainEqual(mockRepository2);
  });

  test("Delete a repository with credentials", async () => {
    mockUserDataStoreFs(mockUserData_1repo_credentials);

    await UserDataStore.deleteRepository("1706889976_myrepo1");

    const repositories = await UserDataStore.getRepositories();
    expect(repositories).toHaveLength(0);

    await expect(
      UserDataStore.getRepositoryCredentials("1706889976_myrepo1"),
    ).rejects.toThrow(Error);
  });

  test("Delete the last repository", async () => {
    mockUserDataStoreFs(mockUserData_1repo);

    await UserDataStore.deleteRepository("1706889976_myrepo1");

    const repositories = await UserDataStore.getRepositories();
    expect(repositories).toHaveLength(0);
  });

  test("Deleting a non-existing repository throws an error", async () => {
    mockUserDataStoreFs(mockUserData_1repo);
    await expect(
      UserDataStore.deleteRepository("1706953975_myrepo2"),
    ).rejects.toThrow(Error);
  });

  test("Retrieve an existing repository", async () => {
    mockUserDataStoreFs(mockUserData_2repo);
    const repository = await UserDataStore.getRepository("1706889976_myrepo1");
    expect(repository).toEqual(mockRepository1);
  });

  test("Retrieve a non-existing repository", async () => {
    mockUserDataStoreFs(mockUserData_2repo);
    await expect(
      UserDataStore.getRepository("non-existing-id"),
    ).rejects.toThrow(Error);
  });
});
