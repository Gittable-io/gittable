import { createAsyncThunk } from "@reduxjs/toolkit";
import { Version, VersionContent } from "@sharedTypes/index";
import { AppRootState } from "./store";

/**
 * Switch to an existing version
 *
 */

// Check this thunk to see how to write one with correct typing
export const switchVersion = createAsyncThunk<
  { currentVersion: Version; content: VersionContent }, // The returned data when the thunk is fullfilled
  Version, // The original payload passed to the thunk
  { state: AppRootState; rejectValue: string } // The state type, and data passed when it's rejected
>("repo/switchVersion", async (version, thunkAPI) => {
  const repositoryId = thunkAPI.getState().repo.repository!.id;

  // 1. Switch versions
  const switchVersionResp = await window.api.switch_version({
    repositoryId: repositoryId,
    version,
  });

  // 2. Get content
  if (switchVersionResp.status === "success") {
    const getCheckoutContentResp = await window.api.get_checked_out_content({
      repositoryId,
    });
    if (getCheckoutContentResp.status === "success") {
      return {
        currentVersion: version,
        content: getCheckoutContentResp.content,
      };
    }
  }

  return thunkAPI.rejectWithValue("Error switching versions");
});
