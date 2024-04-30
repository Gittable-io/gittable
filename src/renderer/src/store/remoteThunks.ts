import { createAsyncThunk } from "@reduxjs/toolkit";
import { RemoteAction, repoActions } from "./repoSlice";
import { AppRootState } from "./store";
import {
  DraftVersion,
  RemoteRepositoryChanges,
  RepositoryCredentials,
} from "@sharedTypes/index";
import {
  fetchRepositoryDetails,
  switchVersion,
  updateVersionContent,
  updateVersions,
} from "./thunks";

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
    | Awaited<ReturnType<typeof window.api.init_repository>>
    | Awaited<ReturnType<typeof window.api.create_draft>>
    | Awaited<ReturnType<typeof window.api.delete_draft>>
    | Awaited<ReturnType<typeof window.api.push_commits>>
    | Awaited<ReturnType<typeof window.api.publish_draft>>
    | Awaited<ReturnType<typeof window.api.get_remote_info>>
    | Awaited<ReturnType<typeof window.api.pull>> // TODO: to remove after refatoring pull
    | Awaited<ReturnType<typeof window.api.pull_new_draft>>
    | null = null;
  switch (action.type) {
    case "INIT_REPO": {
      response = await window.api.init_repository({
        repositoryId,
        credentials,
      });
      break;
    }
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
    case "PUSH_COMMITS": {
      response = await window.api.push_commits({
        repositoryId,
        credentials,
      });
      break;
    }
    case "PUBLISH_DRAFT": {
      response = await window.api.publish_draft({
        repositoryId,
        draftVersion: action.draftVersion,
        newPublishedVersionName: action.publishingName,
        credentials,
      });
      break;
    }
    case "FETCH_REMOTE_REPOSITORY_CHANGES": {
      response = await window.api.get_remote_info({
        repositoryId,
        credentials,
      });
      break;
    }
    case "PULL": {
      // TODO: to remove after refatoring pull
      response = await window.api.pull({
        repositoryId,
        credentials,
      });
      break;
    }
    case "PULL_NEW_DRAFT": {
      response = await window.api.pull_new_draft({
        repositoryId,
        credentials,
        remoteDraftRef: action.draftVersion.branch,
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
    case "INIT_REPO": {
      await thunkAPI.dispatch(fetchRepositoryDetails());
      break;
    }
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
    case "PUSH_COMMITS": {
      await thunkAPI.dispatch(updateVersionContent());
      break;
    }
    case "PUBLISH_DRAFT": {
      await thunkAPI.dispatch(repoActions.closeAllPanels());
      await thunkAPI.dispatch(fetchRepositoryDetails());
      break;
    }
    case "PULL": {
      // TODO: to remove after refatoring pull
      await thunkAPI.dispatch(fetchRepositoryDetails());
      break;
    }
    case "PULL_NEW_DRAFT": {
      await thunkAPI.dispatch(fetchRepositoryDetails());
      await thunkAPI.dispatch(
        repoActions.remoteAction({
          action: {
            type: "FETCH_REMOTE_REPOSITORY_CHANGES",
          },
        }),
      );
      break;
    }
    case "FETCH_REMOTE_REPOSITORY_CHANGES": {
      const remoteChanges: RemoteRepositoryChanges = (
        response as {
          status: "success";
          remoteChanges: RemoteRepositoryChanges;
        }
      ).remoteChanges;

      await thunkAPI.dispatch(repoActions.updateRemoteStatus(remoteChanges));
      break;
    }
  }
  return;
});
