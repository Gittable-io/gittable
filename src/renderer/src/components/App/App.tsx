import { useState } from "react";

import { WelcomePage } from "../welcome/WelcomePage";
import { RepositoryWorkspace } from "../repository-workspace/RepositoryWorkspace";
import { Footer } from "../Footer";
import "./App.css";
import { Repository } from "@sharedTypes/index";
import { ModalProvider } from "react-modal-hook";

/*
I did not export App directly. AppWithModal below
*/
function App(): JSX.Element {
  const [currentRepository, setCurrentRepository] = useState<Repository | null>(
    null,
  );

  return (
    <div className="app-container">
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
