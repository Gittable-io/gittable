import { createAsyncThunk } from "@reduxjs/toolkit";
import { Version, VersionContent } from "@sharedTypes/index";
import { AppRootState } from "./store";

//#region fetchRepositoryDetails
/**
 * Init workspace by retrieving:
 * - The list of versions
 * - The current checked out version
 * - The current checked out version content
 */
export const fetchRepositoryDetails = createAsyncThunk<
  {
    versions: Version[];
    currentVersion: Version;
    content: VersionContent;
  },
  void, // No payload expected
  { state: AppRootState; rejectValue: string }
>("repo/fetchRepositoryDetails", async (_, thunkAPI) => {
  const repositoryId = thunkAPI.getState().repo.repository!.id;

  // 1. Fetch versions
  const listVersionsResp = await window.api.list_versions({ repositoryId });
  if (listVersionsResp.status === "error") {
    return thunkAPI.rejectWithValue("Error fetching versions");
  }

  // 2. Fetch checked out version
  const getCurrentVersionResp = await window.api.get_current_version({
    repositoryId,
  });
  if (getCurrentVersionResp.status === "error") {
    return thunkAPI.rejectWithValue("Error fetching current version");
  }

  // 3. Fetch checked out content
  const getCheckedOutContentResp = await window.api.get_checked_out_content({
    repositoryId,
  });

  if (getCheckedOutContentResp.status === "error") {
    return thunkAPI.rejectWithValue("Error fetching checked out content");
  }

  return {
    versions: listVersionsResp.versions,
    currentVersion: getCurrentVersionResp.version,
    content: getCheckedOutContentResp.content,
  };
});

//#endregion

//#region switchVersion
/**
 * Switch to an existing version and update
 * - Current version
 * - Current checkedout content
 *
 */
// * Check this thunk to see how to write one with correct typing
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

  if (switchVersionResp.status === "error") {
    return thunkAPI.rejectWithValue("Error switching versions");
  }

  // 2. Get content
  const getCheckoutContentResp = await window.api.get_checked_out_content({
    repositoryId,
  });

  if (getCheckoutContentResp.status === "error") {
    return thunkAPI.rejectWithValue("Error fetching checked out content");
  }

  return {
    currentVersion: version,
    content: getCheckoutContentResp.content,
  };
});
//#endregion

//#region createAndSwitchToDraft
/**
 * Create a switch to a new draft version.
 *
 */
export const createAndSwitchToDraft = createAsyncThunk<
  {
    versions: Version[];
    currentVersion: Version;
    content: VersionContent;
  },
  string, // The name of the draft
  { state: AppRootState; rejectValue: string }
>("repo/createAndSwitchToDraft", async (draftName, thunkAPI) => {
  const repositoryId = thunkAPI.getState().repo.repository!.id;

  // 1. Create Draft version
  const createDraftResp = await window.api.create_draft({
    repositoryId,
    name: draftName,
  });

  if (createDraftResp.status === "error") {
    return thunkAPI.rejectWithValue("Error creating draft version");
  }

  // 2. Switch to new draft version
  const switchVersionResp = await window.api.switch_version({
    repositoryId: repositoryId,
    version: createDraftResp.version,
  });

  if (switchVersionResp.status === "error") {
    return thunkAPI.rejectWithValue("Error switching to new draft version");
  }

  // 3. Fetch new list of versions
  const listVersionsResp = await window.api.list_versions({ repositoryId });
  if (listVersionsResp.status === "error") {
    return thunkAPI.rejectWithValue("Error fetching versions");
  }
  // 3. Fetch checked out content
  // * Might be necessary if I created a draft version but I'm not on the latest tag
  const getCheckedOutContentResp = await window.api.get_checked_out_content({
    repositoryId,
  });

  if (getCheckedOutContentResp.status === "error") {
    return thunkAPI.rejectWithValue("Error fetching checked out content");
  }

  return {
    versions: listVersionsResp.versions,
    currentVersion: createDraftResp.version,
    content: getCheckedOutContentResp.content,
  };
});
//#endregion

//#region updateVersionContent
export const updateVersionContent = createAsyncThunk<
  {
    content: VersionContent;
  },
  void, // No payload expected
  { state: AppRootState; rejectValue: string }
>("repo/updateVersionContent", async (_, thunkAPI) => {
  const repositoryId = thunkAPI.getState().repo.repository!.id;

  // 3. Fetch content
  const getCheckedOutContentResp = await window.api.get_checked_out_content({
    repositoryId,
  });

  if (getCheckedOutContentResp.status === "error") {
    return thunkAPI.rejectWithValue("Error fetching checked out content");
  }

  return {
    content: getCheckedOutContentResp.content,
  };
});

//#endregion
