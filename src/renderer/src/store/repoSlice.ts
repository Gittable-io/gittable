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
  createAndSwitchToDraft,
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
    };

export type Panel = { id: string } & PanelDescription;

export type RepoState = {
  repository: Repository | null;

  versions: Version[] | null;
  currentVersion: Version | null;
  checkedOutContent: VersionContent | null;

  panels: Panel[];
  selectedPanelId: string | null;
};

function initState(repository: Repository | null): RepoState {
  return {
    repository,
    versions: null,
    currentVersion: null,
    checkedOutContent: null,

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
          : `${panel.type}_${panel.diff.table.id}_${panel.diff.fromRef}_${panel.diff.toRef}`;

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
        state.checkedOutContent = action.payload.content;
      })
      .addCase(switchVersion.pending, (state, action) => {
        state.currentVersion = action.meta.arg;
        state.checkedOutContent = null;

        state.panels = [];
        state.selectedPanelId = null;
      })
      .addCase(switchVersion.fulfilled, (state, action) => {
        state.currentVersion = action.payload.currentVersion;
        state.checkedOutContent = action.payload.content;
      })
      .addCase(createAndSwitchToDraft.pending, (state) => {
        state.currentVersion = null;
        state.checkedOutContent = null;

        state.panels = [];
        state.selectedPanelId = null;
      })
      .addCase(createAndSwitchToDraft.fulfilled, (state, action) => {
        state.versions = action.payload.versions;
        state.currentVersion = action.payload.currentVersion;
        state.checkedOutContent = action.payload.content;
      })
      .addCase(updateVersionContent.fulfilled, (state, action) => {
        state.checkedOutContent = action.payload.content;
      });
  },
  selectors: {
    isContentModified: (state): boolean => {
      if (state.checkedOutContent == null) return false;

      if (state.checkedOutContent.tables.some((t) => t.modified)) return true;

      return false;
    },
  },
});

export const repoActions = {
  ...repoSlice.actions,
  switchVersion,
  fetchRepositoryDetails,
  createAndSwitchToDraft,
  updateVersionContent,
};
export const repoReducer = repoSlice.reducer;
export const repoSelectors = repoSlice.selectors;
