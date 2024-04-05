import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { Repository } from "@sharedTypes/index";

export type AppState = {
  repositories: Repository[];
  openedRepository: Repository | null;
};

function initState(): AppState {
  return {
    repositories: [],
    openedRepository: null,
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
  },
});

export const appActions = appSlice.actions;
export const appReducer = appSlice.reducer;
