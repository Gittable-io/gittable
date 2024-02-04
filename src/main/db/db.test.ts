/* eslint-disable @typescript-eslint/no-explicit-any */
// I Disabled warning on using any, to be able to mock private methods

import { Repository } from "@sharedTypes/index";
import { UserDataStore, type UserData } from "./db";

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

describe("Test UserDataStore", () => {
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
  };

  const mockUserData_1repo: UserData = {
    repositories: [mockRepository1],
  };

  const mockUserData_2repo: UserData = {
    repositories: [mockRepository1, mockRepository2],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Test getUserData() when user data file exists", async () => {
    mockUserDataStoreFs(mockUserData_1repo);

    const userData = await UserDataStore.getUserData();
    expect(userData).toEqual(mockUserData_1repo);
  });

  test("Test getUserData() when user data file doesn't exist", async () => {
    mockUserDataStoreFs(null);

    const userData = await UserDataStore.getUserData();
    expect(userData).toEqual({ repositories: [] });
  });

  test("Add repository to an empty repository list", async () => {
    mockUserDataStoreFs(mockUserData_0repo);

    const newRepository: Repository = {
      id: "1706892481_myrepo2",
      name: "myrepo2",
      remoteUrl: "http://gitserver.com/user/myrepo2.git",
    };
    await UserDataStore.addRepository(newRepository);

    const userData = await UserDataStore.getUserData();

    expect(userData.repositories).toHaveLength(1);
    expect(userData.repositories[0]).toEqual(newRepository);
  });

  test("Add a repository to a non-empty repository list", async () => {
    mockUserDataStoreFs(mockUserData_1repo);

    const newRepository: Repository = {
      id: "1706892481_myrepo2",
      name: "myrepo2",
      remoteUrl: "http://gitserver.com/user/myrepo2.git",
    };
    await UserDataStore.addRepository(newRepository);

    const userData = await UserDataStore.getUserData();
    expect(userData.repositories).toHaveLength(2);
    expect(userData.repositories).toContainEqual(mockRepository1);
    expect(userData.repositories).toContainEqual(newRepository);
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

    const userData = await UserDataStore.getUserData();
    expect(userData.repositories).toHaveLength(1);
    expect(userData.repositories).toContainEqual(mockRepository2);
  });

  test("Delete the last repository", async () => {
    mockUserDataStoreFs(mockUserData_1repo);

    await UserDataStore.deleteRepository("1706889976_myrepo1");

    const userData = await UserDataStore.getUserData();
    expect(userData.repositories).toHaveLength(0);
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
