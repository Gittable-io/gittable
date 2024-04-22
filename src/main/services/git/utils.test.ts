import * as gitUtils from "./utils";

describe("Test getDraftBranchInfo()", () => {
  test("draft/V1StGXR8_Z5jdHi6B-myT/v1.0.0", () => {
    expect(
      gitUtils.getDraftBranchInfo("draft/V1StGXR8_Z5jdHi6B-myT/v1.0.0"),
    ).toEqual({
      id: "V1StGXR8_Z5jdHi6B-myT",
      name: "v1.0.0",
    });
  });

  test("draft/V1StGXR8_Z5jdHi6B-myT/v1.0.0", () => {
    expect(
      gitUtils.getDraftBranchInfo("draft/V1StGXR8_Z5jdHi6B-myT/v1.0.0"),
    ).toEqual({
      id: "V1StGXR8_Z5jdHi6B-myT",
      name: "v1.0.0",
    });
  });

  test("draft/V1StGXR8_Z5jdHi6B-myT/feat/new-feature", () => {
    expect(
      gitUtils.getDraftBranchInfo(
        "draft/V1StGXR8_Z5jdHi6B-myT/feat/new-feature",
      ),
    ).toEqual({
      id: "V1StGXR8_Z5jdHi6B-myT",
      name: "feat/new-feature",
    });
  });

  test("draft/v1.0.0", () => {
    expect(() => gitUtils.getDraftBranchInfo("draft/v1.0.0")).toThrow();
  });

  test("V1StGXR8_Z5jdHi6B-myT/v1.0.0", () => {
    expect(() =>
      gitUtils.getDraftBranchInfo("V1StGXR8_Z5jdHi6B-myT/v1.0.0"),
    ).toThrow();
  });

  test("v1.0.0", () => {
    expect(() => gitUtils.getDraftBranchInfo("v1.0.0")).toThrow();
  });
});
