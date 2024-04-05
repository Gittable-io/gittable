import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { Repository } from "@sharedTypes/index";

export type AppState = {
  openedRepository: Repository | null;
};

function initState(): AppState {
  return {
    openedRepository: null,
  };
}

export const appSlice = createSlice({
  name: "app",
  initialState: initState(),
  reducers: {
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
