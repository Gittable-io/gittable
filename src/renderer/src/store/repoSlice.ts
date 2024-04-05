import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { Repository } from "@sharedTypes/index";
import { appActions } from "./appSlice";

export type RepoState = {
  repository: Repository;
} | null;

function initState(): RepoState {
  return null;
}

export const repoSlice = createSlice({
  name: "repo",
  initialState: initState(),
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(appActions.openRepository, (_state, action) => {
        return {
          repository: action.payload,
        };
      })
      .addCase(appActions.closeRepository, () => {
        return null;
      });
  },
});

export const repoActions = repoSlice.actions;
export const repoReducer = repoSlice.reducer;
