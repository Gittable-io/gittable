import { useState } from "react";

import { WelcomePage } from "../WelcomePage";
import { RepositoryWorkspace } from "../RepositoryWorkspace";
import { Footer } from "../Footer";
import "./App.css";

export function App(): JSX.Element {
  const [currentRepositoryId, setCurrentRepositoryId] = useState<string | null>(
    null,
  );

  return (
    <div className="app-container">
      <div className="main-container">
        {currentRepositoryId ? (
          <RepositoryWorkspace repositoryId={currentRepositoryId} />
        ) : (
          <WelcomePage
            onRepositorySelect={(repositoryId) =>
              setCurrentRepositoryId(repositoryId)
            }
          />
        )}
      </div>
      <Footer />
    </div>
  );
}
