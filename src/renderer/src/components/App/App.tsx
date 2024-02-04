import { useState } from "react";

import { WelcomePage } from "../WelcomePage";
import { RepositoryWorkspace } from "../RepositoryWorkspace";
import { Footer } from "../Footer";
import "./App.css";
import { Repository } from "@sharedTypes/index";
import { ModalProvider, useModal } from "react-modal-hook";
import ReactModal from "react-modal";

/*
I did not export App directly. AppWithModal below
*/
function App(): JSX.Element {
  const [currentRepository, setCurrentRepository] = useState<Repository | null>(
    null,
  );

  const [showModal, hideModal] = useModal(() => (
    <ReactModal isOpen>
      <p>Modal content</p>
      <button onClick={hideModal}>Hide modal</button>
    </ReactModal>
  ));

  return (
    <div className="app-container">
      <div className="main-container">
        <button onClick={showModal}>Show modal</button>
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
