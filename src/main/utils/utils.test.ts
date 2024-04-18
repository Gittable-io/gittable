import {
  getRepositoryNameFromRemoteUrl,
  getTableIdFromFileName,
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

describe("Test getTableIdFromFileName()", () => {
  test("srs.table.json => srs", () => {
    expect(getTableIdFromFileName("srs.table.json")).toBe("srs");
  });
  test("srs.v0.1.table.json => srs.v0.1", () => {
    expect(getTableIdFromFileName("srs.v0.1.table.json")).toBe("srs.v0.1");
  });

  test("srs.json => throw error", () => {
    expect(() => getTableIdFromFileName("srs.json")).toThrow();
  });

  test("table.json => throw error", () => {
    expect(() => getTableIdFromFileName("table.json")).toThrow();
  });
});
