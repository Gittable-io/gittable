import { useEffect, useState } from "react";

import { WelcomePage } from "../welcome-page/WelcomePage";
import { RepositoryWorkspace } from "../repository-workspace/RepositoryWorkspace";
import { Footer } from "../Footer";
import "./App.css";
import { Repository } from "@sharedTypes/index";
import { ModalProvider } from "react-modal-hook";
import ReactModal from "react-modal";

// Add this as required by the react-modal library to prevent an error in the console (although without it the app functions normally)
ReactModal.setAppElement("#root");

/*
I did not export App directly. AppWithModal below
*/
function App(): JSX.Element {
  const [currentRepository, setCurrentRepository] = useState<Repository | null>(
    null,
  );

  const [gitUserName, setGitUserName] = useState<string>("");
  const [gitUserEmail, setGitUserEmail] = useState<string>("");

  const gitReady: boolean =
    gitUserName != null &&
    gitUserName.trim() !== "" &&
    gitUserEmail != null &&
    gitUserEmail.trim() !== "";

  useEffect(() => {
    const fetchGitConfig = async (): Promise<void> => {
      const response = await window.api.get_git_config();
      setGitUserName(response.gitConfig.user.name);
      setGitUserEmail(response.gitConfig.user.email);
    };

    fetchGitConfig();
  }, []);

  return (
    <div id="app">
      <div className="main-container">
        {currentRepository ? (
          <RepositoryWorkspace
            repository={currentRepository}
            onRepositoryClose={() => setCurrentRepository(null)}
          />
        ) : (
          <WelcomePage
            onRepositorySelect={(repository) =>
              setCurrentRepository(repository)
            }
            gitReady={gitReady}
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
function AppWithModal(): JSX.Element {
  return (
    <ModalProvider>
      <App />
    </ModalProvider>
  );
}

export { AppWithModal as App };
