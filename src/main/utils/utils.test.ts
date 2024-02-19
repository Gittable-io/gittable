import {
  getRepositoryNameFromRemoteUrl,
  getTableNameFromFileName,
} from "./utils";

// Mock app.getPath(), as getConfig() calls it to construct some properties. However we are not running tests in the context of an app
jest.mock("electron", () => {
  const electronModule = jest.requireActual("electron");
  return {
    ...electronModule,
    app: {
      ...electronModule.app,
      getPath: jest.fn(() => ""),
    },
  };
});

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

describe("Test getTableNameFromFileName()", () => {
  test("srs.table.json => srs", () => {
    expect(getTableNameFromFileName("srs.table.json")).toBe("srs");
  });
  test("srs.v0.1.table.json => srs.v0.1", () => {
    expect(getTableNameFromFileName("srs.v0.1.table.json")).toBe("srs.v0.1");
  });

  test("srs.json => srs.json", () => {
    expect(getTableNameFromFileName("srs.json")).toBe("srs.json");
  });

  test("table.json => table.json", () => {
    expect(getTableNameFromFileName("table.json")).toBe("table.json");
  });
});
