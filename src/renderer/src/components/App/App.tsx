import { useEffect } from "react";

import { WelcomePage } from "../welcome-page/WelcomePage";
import { RepositoryWorkspace2 } from "../repository-workspace/RepositoryWorkspace2";
import { Footer } from "../Footer";
import "./App.css";
import { ModalProvider } from "react-modal-hook";
import ReactModal from "react-modal";
import { Provider, useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState, store } from "@renderer/store/store";
import { appActions } from "@renderer/store/appSlice";

// Add this as required by the react-modal library to prevent an error in the console (although without it the app functions normally)
ReactModal.setAppElement("#root");

/*
I did not export App directly. AppWithModal below
*/
function App(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  const openedRepository = useSelector(
    (state: RootState) => state.app.openedRepository,
  );

  useEffect(() => {
    const initState = async (): Promise<void> => {
      // Fetch repositories
      const repositoriesReponse = await window.api.list_repositories();
      if (repositoriesReponse.status === "success") {
        dispatch(appActions.setRepositories(repositoriesReponse.repositories));
      } else {
        console.error("[App/initState] Couldn't retrieve repository list");
      }

      // Fetch Git Config
      const gitConfigResponse = await window.api.get_git_config();
      dispatch(appActions.setGitConfig(gitConfigResponse.gitConfig));
    };

    initState();
  }, [dispatch]);

  return (
    <div id="app">
      <div className="main-container">
        {openedRepository ? <RepositoryWorkspace2 /> : <WelcomePage />}
      </div>
      <Footer />
    </div>
  );
}

/*
Before exporting App, I wrapped it in a <ModalProvider> so that it handles modal
*/
function AppWithReduxAndModal(): JSX.Element {
  return (
    <Provider store={store}>
      <ModalProvider>
        <App />
      </ModalProvider>
    </Provider>
  );
}

export { AppWithReduxAndModal as App };
