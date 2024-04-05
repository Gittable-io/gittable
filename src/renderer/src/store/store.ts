import { configureStore } from "@reduxjs/toolkit";
import { appReducer } from "./appSlice";
import logger from "redux-logger";
import { repoReducer } from "./repoSlice";

export const store = configureStore({
  reducer: {
    app: appReducer,
    repo: repoReducer,
  },

  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(logger),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
