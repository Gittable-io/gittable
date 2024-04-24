import * as gitUtils from "./utils";

describe("Test getDraftBranchInfo()", () => {
  test("draft/v1.0.0_bqp3gjaoxUTxjklVwf3O", () => {
    expect(
      gitUtils.getDraftBranchInfo("draft/v1.0.0_bqp3gjaoxUTxjklVwf3O"),
    ).toEqual({
      id: "bqp3gjaoxUTxjklVwf3O",
      name: "v1.0.0",
    });
  });

  test("draft/feat/new-feature_bqp3gjaoxUTxjklVwf3O", () => {
    expect(
      gitUtils.getDraftBranchInfo(
        "draft/feat/new-feature_bqp3gjaoxUTxjklVwf3O",
      ),
    ).toEqual({
      id: "bqp3gjaoxUTxjklVwf3O",
      name: "feat/new-feature",
    });
  });

  test("draft/v1.0.0", () => {
    expect(() => gitUtils.getDraftBranchInfo("draft/v1.0.0")).toThrow();
  });

  test("bqp3gjaoxUTxjklVwf3O/v1.0.0", () => {
    expect(() =>
      gitUtils.getDraftBranchInfo("bqp3gjaoxUTxjklVwf3O/v1.0.0"),
    ).toThrow();
  });

  test("v1.0.0", () => {
    expect(() => gitUtils.getDraftBranchInfo("v1.0.0")).toThrow();
  });

  test("draft/v1.0.0_", () => {
    expect(() => gitUtils.getDraftBranchInfo("draft/v1.0.0_")).toThrow();
  });
});
