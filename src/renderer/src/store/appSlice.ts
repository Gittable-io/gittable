import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { Repository } from "@sharedTypes/index";
import { nanoid } from "nanoid";

export type GitConfig = {
  user: {
    name: string;
    email: string;
  };
};

export type SnackbarNotification = {
  id: string;
  type: "error" | "info";
  message: string;
};

export type AppState = {
  repositories: Repository[];
  openedRepository: Repository | null;
  gitConfig: GitConfig;

  snackbars: SnackbarNotification[];
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
    snackbars: [],
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
    addSnackbar: (
      state,
      action: PayloadAction<Omit<SnackbarNotification, "id">>,
    ) => {
      const notif = { id: nanoid(), ...action.payload };
      state.snackbars.push(notif);
    },
    removeSnackbar: (state, action: PayloadAction<string>) => {
      const idx = state.snackbars.findIndex(
        (notif) => notif.id === action.payload,
      );
      if (idx !== -1) state.snackbars.splice(idx, 1);
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
