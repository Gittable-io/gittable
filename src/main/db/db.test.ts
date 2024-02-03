/* eslint-disable @typescript-eslint/no-explicit-any */
// I Disabled warning on using any, to be able to mock private methods

import { Repository } from "@sharedTypes/index";
import { UserDataStore, type UserData } from "./db";

describe("Test UserDataStore", () => {
  const mockRepository1 = {
    id: "1706889976_myrepo1",
    name: "myrepo1",
    remoteUrl: "http://gitserver.com/user/myrepo1.git",
  };

  const mockUserData_0repo: UserData = {
    repositories: [],
  };

  const mockUserData_1repo: UserData = {
    repositories: [mockRepository1],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    jest
      .spyOn(UserDataStore as any, "userDataFileExists")
      .mockResolvedValue(true);
    jest.spyOn(UserDataStore as any, "save").mockResolvedValue(undefined);
  });

  test("Test getUserData() when user data file exists", async () => {
    jest
      .spyOn(UserDataStore as any, "fetchUserData")
      .mockResolvedValue(mockUserData_1repo);

    const userData = await UserDataStore.getUserData();
    expect(userData).toEqual(mockUserData_1repo);
  });

  test("Test getUserData() when user data file doesn't exist", async () => {
    jest
      .spyOn(UserDataStore as any, "fetchUserData")
      .mockResolvedValue(mockUserData_1repo);

    jest
      .spyOn(UserDataStore as any, "userDataFileExists")
      .mockResolvedValue(false);

    const userData = await UserDataStore.getUserData();
    expect(userData).toEqual({ repositories: [] });
  });

  test("Add repository to an empty repository list", async () => {
    jest
      .spyOn(UserDataStore as any, "fetchUserData")
      .mockResolvedValue(mockUserData_0repo);

    const newRepository: Repository = {
      id: "1706892481_myrepo2",
      name: "myrepo2",
      remoteUrl: "http://gitserver.com/user/myrepo2.git",
    };
    const newUserData = await UserDataStore.addRepository(newRepository);

    const expectedUserData: UserData = {
      repositories: [newRepository],
    };

    expect(newUserData).toEqual(expectedUserData);
  });

  test("Adding a repository to a non-empty repository list", async () => {
    jest
      .spyOn(UserDataStore as any, "fetchUserData")
      .mockResolvedValue(mockUserData_1repo);

    const newRepository: Repository = {
      id: "1706892481_myrepo2",
      name: "myrepo2",
      remoteUrl: "http://gitserver.com/user/myrepo2.git",
    };
    const newUserData = await UserDataStore.addRepository(newRepository);

    const expectedUserData: UserData = {
      repositories: [mockRepository1, newRepository],
    };

    expect(newUserData).toEqual(expectedUserData);
  });

  test("Adding an existing repository", async () => {
    jest
      .spyOn(UserDataStore as any, "fetchUserData")
      .mockResolvedValue(mockUserData_1repo);

    const mockRepository1_copy = {
      id: "1706889976_myrepo1",
      name: "myrepo1",
      remoteUrl: "http://gitserver.com/user/myrepo1.git",
    };

    await expect(
      UserDataStore.addRepository(mockRepository1_copy),
    ).rejects.toThrow(Error);
  });
});
