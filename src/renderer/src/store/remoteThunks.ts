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
import { appActions } from "./appSlice";

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
    case "LOOKUP_REMOTE_REPO_CHANGES": {
      response = await window.api.get_remote_info({
        repositoryId,
        credentials,
      });
      break;
    }
    case "PULL_NEW_DRAFT": {
      response = await window.api.pull_new_draft({
        repositoryId,
        credentials,
        remoteDraftVersion: action.draftVersion,
      });
      break;
    }
    case "PULL_NEW_COMMITS": {
      response = await window.api.pull_new_commits({
        repositoryId,
        credentials,
        draftVersion: action.version,
      });
      break;
    }
    case "PULL_DELETED_DRAFT": {
      response = await window.api.pull_deleted_draft({
        repositoryId,
        credentials,
        draftVersion: action.version,
      });
      break;
    }
    case "PULL_NEW_PUBLISHED_VERSIONS": {
      response = await window.api.pull_new_published_versions({
        repositoryId,
        credentials,
      });
      break;
    }
  }

  // 2. Check if there's an error
  if (response.status === "error") {
    // If it's a common authentication error
    if (response.type === "NO_PROVIDED_CREDENTIALS") {
      return thunkAPI.rejectWithValue("NO_PROVIDED_CREDENTIALS");
    } else if (response.type === "AUTH_ERROR_WITH_CREDENTIALS") {
      return thunkAPI.rejectWithValue("AUTH_ERROR_WITH_CREDENTIALS");
    }

    // else, if it's a specific action error
    if (action.type === "PUSH_COMMITS") {
      if (response.type === "UNPULLED_REMOTE_COMMITS") {
        thunkAPI.dispatch(
          appActions.addSnackbar({
            type: "error",
            message:
              "There are documents modified by your teammates. You have to first retrieve them and make sure they do not conflict with your changes.",
          }),
        );
      }
    }

    return thunkAPI.rejectWithValue("UNKNOWN_ERROR");
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
    case "PULL_NEW_COMMITS":
    case "PULL_NEW_DRAFT":
    case "PULL_DELETED_DRAFT":
    case "PULL_NEW_PUBLISHED_VERSIONS": {
      await thunkAPI.dispatch(fetchRepositoryDetails());
      await thunkAPI.dispatch(
        repoActions.remoteAction({
          action: {
            type: "LOOKUP_REMOTE_REPO_CHANGES",
          },
        }),
      );
      break;
    }
    case "LOOKUP_REMOTE_REPO_CHANGES": {
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
