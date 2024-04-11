import { createAsyncThunk } from "@reduxjs/toolkit";
import { RemoteAction, repoActions } from "./repoSlice";
import { AppRootState } from "./store";
import { DraftVersion, RepositoryCredentials } from "@sharedTypes/index";
import { switchVersion, updateVersions } from "./thunks";

export const remoteAction = createAsyncThunk<
  void,
  { action: RemoteAction; credentials?: RepositoryCredentials },
  {
    state: AppRootState;
    rejectValue:
      | "NO_PROVIDED_CREDENTIALS"
      | "AUTH_ERROR_WITH_CREDENTIALS"
      | "UNKNOWN_ERROR";
  }
>("repo/remoteAction", async ({ action, credentials }, thunkAPI) => {
  const repositoryId = thunkAPI.getState().repo.repository!.id;

  // 1. Do the remote action
  let response:
    | Awaited<ReturnType<typeof window.api.create_draft>>
    | Awaited<ReturnType<typeof window.api.delete_draft>>
    | null = null;
  switch (action.type) {
    case "CREATE_DRAFT": {
      response = await window.api.create_draft({
        repositoryId,
        name: action.draftName,
        credentials,
      });
      break;
    }
    case "DELETE_DRAFT": {
      response = await window.api.delete_draft({
        repositoryId,
        version: action.draftVersion,
        credentials,
      });
      break;
    }
  }

  // 2. Check if there's an error
  if (response.status === "error") {
    switch (response.type) {
      case "NO_PROVIDED_CREDENTIALS": {
        return thunkAPI.rejectWithValue("NO_PROVIDED_CREDENTIALS");
      }
      case "AUTH_ERROR_WITH_CREDENTIALS": {
        return thunkAPI.rejectWithValue("AUTH_ERROR_WITH_CREDENTIALS");
      }
      default: {
        return thunkAPI.rejectWithValue("UNKNOWN_ERROR");
      }
    }
  }

  // 3. If success, dispatch an action that will update
  switch (action.type) {
    case "CREATE_DRAFT": {
      thunkAPI.dispatch(repoActions.setWaitingForNewDraftName(false));
      await thunkAPI.dispatch(updateVersions());

      const newDraftVersion: DraftVersion = (
        response as {
          status: "success";
          version: DraftVersion;
        }
      ).version;
      await thunkAPI.dispatch(switchVersion(newDraftVersion));
      break;
    }
    case "DELETE_DRAFT": {
      await thunkAPI.dispatch(updateVersions());
      break;
    }
  }
  return;
});
