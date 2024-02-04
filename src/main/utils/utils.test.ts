import { getRepositoryNameFromRemoteUrl } from "./utils";

describe("Test getRepositoryNameFromRemoteUrl()", () => {
  test("https://github.com/user/repo.git => repo", () => {
    expect(
      getRepositoryNameFromRemoteUrl("https://github.com/user/repo.git"),
    ).toBe("repo");
  });

  test("https://github.com/user/repo.git/ => repo", () => {
    expect(
      getRepositoryNameFromRemoteUrl("https://github.com/user/repo.git/"),
    ).toBe("repo");
  });

  test("https://github.com/user/repo => repo", () => {
    expect(getRepositoryNameFromRemoteUrl("https://github.com/user/repo")).toBe(
      "repo",
    );
  });
});
