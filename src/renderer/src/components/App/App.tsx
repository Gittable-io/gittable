import { useState } from "react";

import { WelcomePage } from "../WelcomePage";
import { RepositoryWorkspace } from "../RepositoryWorkspace";
import { Footer } from "../Footer";
import "./App.css";
import { Repository } from "@sharedTypes/index";

export function App(): JSX.Element {
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
