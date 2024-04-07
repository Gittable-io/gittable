import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { Repository } from "@sharedTypes/index";
import { appActions } from "./appSlice";

export type RepoState = {
  repository: Repository | null;

  loading: {
    completedLoadingVersions: boolean;
    completedCheckout: boolean;
  };
  checkedOutVersion: string | null;

  versions: string[];
};

function initState(repository: Repository | null): RepoState {
  return {
    repository,
    loading: {
      completedLoadingVersions: false,
      completedCheckout: false,
    },

    versions: [],
    checkedOutVersion: null,
  };
}

export const repoSlice = createSlice({
  name: "repo",
  initialState: initState(null),
  reducers: {
    setVersions: (
      state,
      action: PayloadAction<{ versions: string[]; checkedOutVersion: string }>,
    ) => {
      state.versions = action.payload.versions;
      state.checkedOutVersion = action.payload.checkedOutVersion;

      state.loading.completedLoadingVersions = true;
    },
    completeCheckout: (state) => {
      state.loading.completedCheckout = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(appActions.openRepository, (_state, action) => {
        return initState(action.payload);
      })
      .addCase(appActions.closeRepository, () => {
        return initState(null);
      });
  },
});

export const repoActions = repoSlice.actions;
export const repoReducer = repoSlice.reducer;
