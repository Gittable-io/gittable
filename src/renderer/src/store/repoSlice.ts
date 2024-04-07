import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { Repository } from "@sharedTypes/index";
import { appActions } from "./appSlice";

export type RepoState = {
  repository: Repository | null;
  loading: boolean;
  checkedOutVersion: string | null;

  versions: string[];
};

function initState(repository: Repository | null): RepoState {
  return { repository, loading: true, versions: [], checkedOutVersion: null };
}

export const repoSlice = createSlice({
  name: "repo",
  initialState: initState(null),
  reducers: {
    setVersions: (state, action: PayloadAction<string[]>) => {
      state.versions = action.payload;
    },
    checkoutVersion: (state, action: PayloadAction<string>) => {
      state.checkedOutVersion = action.payload;
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
