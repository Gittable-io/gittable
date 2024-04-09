import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  Repository,
  TableMetadata,
  Version,
  VersionContent,
} from "@sharedTypes/index";
import { appActions } from "./appSlice";
import {
  commit,
  createAndSwitchToDraft,
  deleteDraft,
  discardChanges,
  fetchRepositoryDetails,
  switchVersion,
  updateVersionContent,
} from "./thunks";

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

export type RepoState = {
  repository: Repository | null;

  progress: {
    discardInProgress: boolean;
    commitInProgress: boolean;
    deleteDraftInProgress: boolean;
  };

  versions: Version[] | null;
  currentVersion: Version | null;
  currentVersionContent: VersionContent | null;

  panels: Panel[];
  selectedPanelId: string | null;
};

function initState(repository: Repository | null): RepoState {
  return {
    repository,

    progress: {
      discardInProgress: false,
      commitInProgress: false,
      deleteDraftInProgress: false,
    },

    versions: null,
    currentVersion: null,
    currentVersionContent: null,

    panels: [],
    selectedPanelId: null,
  };
}

export const repoSlice = createSlice({
  name: "repo",
  initialState: initState(null),
  reducers: {
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
        state.currentVersion = action.payload.currentVersion;
        state.currentVersionContent = action.payload.content;
      })
      .addCase(createAndSwitchToDraft.pending, (state) => {
        state.currentVersion = null;
        state.currentVersionContent = null;

        state.panels = [];
        state.selectedPanelId = null;
      })
      .addCase(createAndSwitchToDraft.fulfilled, (state, action) => {
        state.versions = action.payload.versions;
        state.currentVersion = action.payload.currentVersion;
        state.currentVersionContent = action.payload.content;
      })
      .addCase(updateVersionContent.fulfilled, (state, action) => {
        state.currentVersionContent = action.payload.content;
      })
      .addCase(discardChanges.pending, (state) => {
        state.progress.discardInProgress = true;
      })
      .addCase(discardChanges.fulfilled, (state, action) => {
        state.progress.discardInProgress = false;
        state.currentVersionContent = action.payload.content;
      })
      .addCase(commit.pending, (state) => {
        state.progress.commitInProgress = true;
      })
      .addCase(commit.fulfilled, (state, action) => {
        state.progress.commitInProgress = false;
        state.currentVersionContent = action.payload.content;
      })
      .addCase(deleteDraft.pending, (state) => {
        state.progress.deleteDraftInProgress = true;
      })
      .addCase(deleteDraft.fulfilled, (state, action) => {
        state.progress.deleteDraftInProgress = false;
        state.versions = action.payload.versions;
      });
  },
  selectors: {
    isContentModified: (state): boolean => {
      if (state.currentVersionContent == null) return false;

      if (state.currentVersionContent.tables.some((t) => t.modified))
        return true;

      return false;
    },
  },
});

export const repoActions = {
  ...repoSlice.actions,
  switchVersion,
  fetchRepositoryDetails,
  createAndSwitchToDraft,
  deleteDraft,
  updateVersionContent,
  discardChanges,
  commit,
};
export const repoReducer = repoSlice.reducer;
export const repoSelectors = repoSlice.selectors;
