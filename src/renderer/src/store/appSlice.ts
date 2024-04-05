import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { Repository } from "@sharedTypes/index";

export type GitConfig = {
  user: {
    name: string;
    email: string;
  };
};

export type AppState = {
  repositories: Repository[];
  openedRepository: Repository | null;
  gitConfig: GitConfig;
};

function initState(): AppState {
  return {
    repositories: [],
    openedRepository: null,
    gitConfig: {
      user: {
        name: "",
        email: "",
      },
    },
  };
}

export const appSlice = createSlice({
  name: "app",
  initialState: initState(),
  reducers: {
    setRepositories: (state, action: PayloadAction<Repository[]>) => {
      state.repositories = action.payload;
    },
    addRepository: (state, action: PayloadAction<Repository>) => {
      state.repositories.push(action.payload);
    },
    deleteRepository: (state, action: PayloadAction<string>) => {
      const idx = state.repositories.findIndex(
        (repo) => repo.id === action.payload,
      );
      if (idx !== -1) state.repositories.splice(idx, 1);
    },
    openRepository: (state, action: PayloadAction<Repository>) => {
      state.openedRepository = action.payload;
    },
    closeRepository: (state) => {
      state.openedRepository = null;
    },
    setGitConfig: (state, action: PayloadAction<GitConfig>) => {
      state.gitConfig = action.payload;
    },
  },
  selectors: {
    isGitConfigured: (state): boolean =>
      state.gitConfig.user.name.trim().length > 0 &&
      state.gitConfig.user.email.trim().length > 0,
  },
});

export const appActions = appSlice.actions;
export const appReducer = appSlice.reducer;
export const appSelectors = appSlice.selectors;
