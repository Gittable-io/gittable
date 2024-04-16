import { createAsyncThunk } from "@reduxjs/toolkit";
import { RepositoryStatus, Version, VersionContent } from "@sharedTypes/index";
import { AppRootState } from "./store";

//#region fetchRepositoryDetails
/**
 * Init workspace by retrieving:
 * - The repository status
 * if repository is not empty: fetch:
 * - The list of versions
 * - The current checked out version
 * - The current checked out version content
 */
export const fetchRepositoryDetails = createAsyncThunk<
  {
    status: RepositoryStatus;
    versions: Version[] | null;
    currentVersion: Version | null;
    content: VersionContent | null;
  },
  void, // No payload expected
  { state: AppRootState; rejectValue: string }
>("repo/fetchRepositoryDetails", async (_, thunkAPI) => {
  const repositoryId = thunkAPI.getState().repo.repository!.id;

  // 1. Fetch repository Status
  const repoStatusResp = await window.api.get_repository_status({
    repositoryId,
  });
  if (repoStatusResp.status === "error") {
    return thunkAPI.rejectWithValue("Error fetching repsoitory status");
  }

  if (repoStatusResp.repositoryStatus === "NOT_INITIALIZED") {
    return {
      status: repoStatusResp.repositoryStatus,
      versions: null,
      currentVersion: null,
      content: null,
    };
  }

  // 2. Fetch versions
  const listVersionsResp = await window.api.list_versions({ repositoryId });
  if (listVersionsResp.status === "error") {
    return thunkAPI.rejectWithValue("Error fetching versions");
  }

  // 3. Fetch current version
  const currentVersionResp = await window.api.get_current_version({
    repositoryId,
  });
  if (currentVersionResp.status === "error") {
    return thunkAPI.rejectWithValue(
      `Error fetching current version: ${currentVersionResp.type}`,
    );
  }

  // 4. Fetch checked out content
  const currentContentResp = await window.api.get_current_version_content({
    repositoryId,
  });

  if (currentContentResp.status === "error") {
    return thunkAPI.rejectWithValue("Error fetching checked out content");
  }

  return {
    status: repoStatusResp.repositoryStatus,
    versions: listVersionsResp.versions,
    currentVersion: currentVersionResp.version,
    content: currentContentResp.content,
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
  const currentContentResp = await window.api.get_current_version_content({
    repositoryId,
  });

  if (currentContentResp.status === "error") {
    return thunkAPI.rejectWithValue("Error fetching checked out content");
  }

  return {
    currentVersion: version,
    content: currentContentResp.content,
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
  const currentContentResp = await window.api.get_current_version_content({
    repositoryId,
  });

  if (currentContentResp.status === "error") {
    return thunkAPI.rejectWithValue("Error fetching checked out content");
  }

  return {
    content: currentContentResp.content,
  };
});

//#endregion

//#region updateVersions
export const updateVersions = createAsyncThunk<
  {
    status: RepositoryStatus;
    versions: Version[];
  },
  void, // No payload expected
  { state: AppRootState; rejectValue: string }
>("repo/updateVersions", async (_, thunkAPI) => {
  const repositoryId = thunkAPI.getState().repo.repository!.id;

  // 1. Fetch repository Status
  // why? because when we update version, the repository status may get updated too
  const repoStatusResp = await window.api.get_repository_status({
    repositoryId,
  });
  if (repoStatusResp.status === "error") {
    return thunkAPI.rejectWithValue("Error fetching repsoitory status");
  }

  // 2. Fetch versions
  const versionsResp = await window.api.list_versions({
    repositoryId,
  });

  if (versionsResp.status === "error") {
    return thunkAPI.rejectWithValue("Error fetching checked out content");
  }

  return {
    status: repoStatusResp.repositoryStatus,
    versions: versionsResp.versions,
  };
});

//#endregion

//#region discardChanges
export const discardChanges = createAsyncThunk<
  {
    content: VersionContent;
  },
  void, // No payload expected
  { state: AppRootState; rejectValue: string }
>("repo/discardChanges", async (_, thunkAPI) => {
  const repositoryId = thunkAPI.getState().repo.repository!.id;

  // 1. Discard changes
  const discardResp = await window.api.discard_changes({
    repositoryId,
  });

  if (discardResp.status === "error") {
    return thunkAPI.rejectWithValue("Error discarding");
  }

  // 2. Update content
  const contentResp = await window.api.get_current_version_content({
    repositoryId,
  });

  if (contentResp.status === "error") {
    return thunkAPI.rejectWithValue("Error fetching checked out content");
  }

  return {
    content: contentResp.content,
  };
});

//#endregion

//#region commit
export const commit = createAsyncThunk<
  {
    content: VersionContent;
  },
  string, // No payload expected
  { state: AppRootState; rejectValue: string }
>("repo/commit", async (message, thunkAPI) => {
  const repositoryId = thunkAPI.getState().repo.repository!.id;

  // 1. Commit changes
  const commitResp = await window.api.commit({
    repositoryId,
    message,
  });

  if (commitResp.status === "error") {
    return thunkAPI.rejectWithValue(`Error committing: ${commitResp.type}`);
  }

  // 2. Update content
  const contentResp = await window.api.get_current_version_content({
    repositoryId,
  });

  if (contentResp.status === "error") {
    return thunkAPI.rejectWithValue("Error fetching checked out content");
  }

  return {
    content: contentResp.content,
  };
});

//#endregion
