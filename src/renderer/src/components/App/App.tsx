import { useEffect, useState } from "react";

import { WelcomePage } from "../welcome-page/WelcomePage";
import { RepositoryWorkspace } from "../repository-workspace/RepositoryWorkspace";
import { Footer } from "../Footer";
import "./App.css";
import { ModalProvider } from "react-modal-hook";
import ReactModal from "react-modal";
import { Provider, useSelector } from "react-redux";
import { RootState, store } from "@renderer/store/store";

// Add this as required by the react-modal library to prevent an error in the console (although without it the app functions normally)
ReactModal.setAppElement("#root");

/*
I did not export App directly. AppWithModal below
*/
function App(): JSX.Element {
  const openedRepository = useSelector(
    (state: RootState) => state.app.openedRepository,
  );

  const [gitUserName, setGitUserName] = useState<string>("");
  const [gitUserEmail, setGitUserEmail] = useState<string>("");

  const gitReady: boolean =
    gitUserName != null &&
    gitUserName.trim() !== "" &&
    gitUserEmail != null &&
    gitUserEmail.trim() !== "";

  const fetchGitConfig = async (): Promise<void> => {
    const response = await window.api.get_git_config();
    setGitUserName(response.gitConfig.user.name);
    setGitUserEmail(response.gitConfig.user.email);
  };

  const onGitConfigChange = async (): Promise<void> => {
    fetchGitConfig();
  };

  useEffect(() => {
    fetchGitConfig();
  }, []);

  return (
    <div id="app">
      <div className="main-container">
        {openedRepository ? (
          <RepositoryWorkspace />
        ) : (
          <WelcomePage
            gitReady={gitReady}
            onGitConfigChange={onGitConfigChange}
          />
        )}
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
