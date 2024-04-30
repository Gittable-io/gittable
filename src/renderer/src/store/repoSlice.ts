import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  DraftVersion,
  PullNewDraftAction,
  RemoteRepositoryChanges,
  Repository,
  RepositoryStatus,
  TableMetadata,
  Version,
  VersionContent,
} from "@sharedTypes/index";
import { appActions } from "./appSlice";
import {
  addTable,
  commit,
  discardChanges,
  fetchRepositoryDetails,
  switchVersion,
  updateVersionContent,
  updateVersions,
} from "./thunks";
import { remoteAction } from "./remoteThunks";
import { isVersionEqual } from "@renderer/utils/utils";

export type DiffDescription = {
  table: TableMetadata;
  fromRef: "HEAD";
  toRef: "WorkingDir";
};

export type PanelDescription =
  | {
      type: "table";
      table: TableMetadata;
    }
  | {
      type: "diff";
      diff: DiffDescription;
    }
  | {
      type: "review_current_version";
    };

export type Panel = { id: string } & PanelDescription;

export type RemoteAction =
  | { type: "INIT_REPO" }
  | {
      type: "CREATE_DRAFT";
      draftName: string;
    }
  | { type: "DELETE_DRAFT"; draftVersion: DraftVersion }
  | { type: "PUSH_COMMITS" }
  | {
      type: "PUBLISH_DRAFT";
      draftVersion: DraftVersion;
      publishingName: string;
    }
  | { type: "FETCH_REMOTE_REPOSITORY_CHANGES" }
  | { type: "PULL" } // TODO: to remove after refatoring pull
  | PullNewDraftAction;

export type RepoState = {
  // Repository information
  repository: Repository | null;
  status: RepositoryStatus | null;
  remoteStatus: RemoteRepositoryChanges | null;
  versions: Version[] | null;
  currentVersion: Version | null;
  currentVersionContent: VersionContent | null;

  // UI information
  progress: {
    discardInProgress: boolean;
    commitInProgress: boolean;
    addTable: "WAITING_FOR_INPUT" | "WAITING_FOR_REQUEST" | null;
  };

  //TODO: this variable should be removed when I refactor the UI
  waitingForNewDraftName: boolean;

  remoteActionSequence: null | {
    action: RemoteAction;
    step:
      | "IN_PROGRESS"
      | "REQUESTING_CREDENTIALS"
      | "AUTH_ERROR"
      | "UNKOWN_ERROR";
  };

  panels: Panel[];
  selectedPanelId: string | null;
};

function initState(repository: Repository | null): RepoState {
  return {
    repository,
    status: null,
    remoteStatus: null,
    versions: null,
    currentVersion: null,
    currentVersionContent: null,

    progress: {
      discardInProgress: false,
      commitInProgress: false,
      addTable: null,
    },

    waitingForNewDraftName: false,

    remoteActionSequence: null,

    panels: [],
    selectedPanelId: null,
  };
}

export const repoSlice = createSlice({
  name: "repo",
  initialState: initState(null),
  reducers: {
    cancelRemoteAction: (state) => {
      state.remoteActionSequence = null;
    },
    updateRemoteStatus: (
      state,
      action: PayloadAction<RemoteRepositoryChanges>,
    ) => {
      state.remoteStatus = action.payload;
    },
    setWaitingForNewDraftName: (state, action: PayloadAction<boolean>) => {
      state.waitingForNewDraftName = action.payload;
    },
    beginCreateTable: (state) => {
      state.progress.addTable = "WAITING_FOR_INPUT";
    },
    cancelCreateTable: (state) => {
      state.progress.addTable = null;
    },

    openPanel: (state, action: PayloadAction<PanelDescription>) => {
      const panel = action.payload;

      const panelId =
        panel.type === "table"
          ? `${panel.type}_${panel.table.id}`
          : panel.type === "diff"
            ? `${panel.type}_${panel.diff.table.id}_${panel.diff.fromRef}_${panel.diff.toRef}`
            : "review_current_version";

      if (!state.panels.find((p) => p.id === panelId)) {
        state.panels.push({ id: panelId, ...panel });
      }
      state.selectedPanelId = panelId;
    },
    selectPanel: (state, action: PayloadAction<string>) => {
      if (state.panels.find((p) => p.id === action.payload)) {
        state.selectedPanelId = action.payload;
      }
    },
    closePanel: (state, action: PayloadAction<string>) => {
      const panelId = action.payload;
      const positiondIdx = state.panels.findIndex((p) => p.id === panelId);
      if (positiondIdx !== -1) {
        // If we're closing the selected tab
        if (state.selectedPanelId === panelId) {
          // If it's the last tab, set selection to null
          if (state.panels.length === 1) state.selectedPanelId = null;
          // else if the selected tab is the last one to the right, select the tab to its left
          else if (positiondIdx === state.panels.length - 1)
            state.selectedPanelId = state.panels[positiondIdx - 1].id;
          // else select the tab to its right
          else state.selectedPanelId = state.panels[positiondIdx + 1].id;
        }

        state.panels.splice(positiondIdx, 1);
      }
    },
    closeAllPanels: (state) => {
      state.panels = [];
      state.selectedPanelId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(appActions.openRepository, (_state, action) => {
        return initState(action.payload);
      })
      .addCase(appActions.closeRepository, () => {
        return initState(null);
      })
      .addCase(fetchRepositoryDetails.fulfilled, (state, action) => {
        // If we switched versions, then close all panels
        if (
          !isVersionEqual(state.currentVersion, action.payload.currentVersion)
        ) {
          state.panels = [];
          state.selectedPanelId = null;
        }

        state.status = action.payload.status;
        state.versions = action.payload.versions;
        state.currentVersion = action.payload.currentVersion;
        state.currentVersionContent = action.payload.content;
      })
      .addCase(switchVersion.pending, (state, action) => {
        state.currentVersion = action.meta.arg;
        state.currentVersionContent = null;

        state.panels = [];
        state.selectedPanelId = null;
      })
      .addCase(switchVersion.fulfilled, (state, action) => {
        state.progress.addTable = null;
        state.currentVersion = action.payload.currentVersion;
        state.currentVersionContent = action.payload.content;
      })
      .addCase(updateVersionContent.fulfilled, (state, action) => {
        state.currentVersionContent = action.payload.content;
      })
      .addCase(updateVersions.fulfilled, (state, action) => {
        state.status = action.payload.status;
        state.versions = action.payload.versions;
      })
      .addCase(discardChanges.pending, (state) => {
        state.progress.discardInProgress = true;
      })
      .addCase(discardChanges.fulfilled, (state) => {
        state.progress.discardInProgress = false;
      })
      .addCase(commit.pending, (state) => {
        state.progress.commitInProgress = true;
      })
      .addCase(commit.fulfilled, (state, action) => {
        state.progress.commitInProgress = false;
        state.currentVersionContent = action.payload.content;
      })
      .addCase(addTable.pending, (state) => {
        state.progress.addTable = "WAITING_FOR_REQUEST";
      })
      .addCase(addTable.fulfilled, (state) => {
        state.progress.addTable = null;
      })
      .addCase(remoteAction.pending, (state, action) => {
        state.remoteActionSequence = {
          action: action.meta.arg.action,
          step: "IN_PROGRESS",
        };
      })
      .addCase(remoteAction.fulfilled, (state) => {
        state.remoteActionSequence = null;
      })
      .addCase(remoteAction.rejected, (state, action) => {
        if (action.payload === "NO_PROVIDED_CREDENTIALS") {
          state.remoteActionSequence!.step = "REQUESTING_CREDENTIALS";
        } else if (action.payload === "AUTH_ERROR_WITH_CREDENTIALS") {
          state.remoteActionSequence!.step = "AUTH_ERROR";
        } else {
          state.remoteActionSequence!.step = "UNKOWN_ERROR";
        }
      });
  },
  selectors: {
    isWorkspaceDataCompletelyLoaded: (state): boolean => {
      return (
        state.repository != null &&
        state.status != null &&
        state.versions != null &&
        state.currentVersion != null &&
        state.currentVersionContent != null
      );
    },
    isWorkingDirModified: (state): boolean => {
      if (state.currentVersionContent == null) return false;

      if (state.currentVersionContent.tables.some((t) => t.change !== "none"))
        return true;

      return false;
    },
    isRemoteRepositoryModified: (state): boolean => {
      if (state.remoteStatus == null) return false;

      return (
        state.remoteStatus.deletedDraft != undefined ||
        state.remoteStatus.newCommits != undefined ||
        state.remoteStatus.newDraft != undefined ||
        state.remoteStatus.newPublishedVersions != undefined
      );
    },
    draftVersion: (state): DraftVersion | null => {
      const draftVersion = state.versions?.find((v) => v.type === "draft");
      return draftVersion ? (draftVersion as DraftVersion) : null;
    },
  },
});

export const repoActions = {
  ...repoSlice.actions,
  switchVersion,
  fetchRepositoryDetails,
  updateVersionContent,
  discardChanges,
  commit,
  addTable,
  remoteAction,
};
export const repoReducer = repoSlice.reducer;
export const repoSelectors = repoSlice.selectors;
