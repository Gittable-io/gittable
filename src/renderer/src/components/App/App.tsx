import { useState } from "react";

import { WelcomePage } from "../WelcomePage";
import { ProjectWorkspace } from "../ProjectWorkspace";
import { Footer } from "../Footer";
import "./App.css";

export function App(): JSX.Element {
  const [currentProjectPath, setCurrentProjectPath] = useState<string | null>(
    null,
  );

  return (
    <div className="app-container">
      <div className="main-container">
        {currentProjectPath ? (
          <ProjectWorkspace projectPath={currentProjectPath} />
        ) : (
          <WelcomePage
            onProjectOpen={(projectPath) => setCurrentProjectPath(projectPath)}
          />
        )}
      </div>
      <Footer />
    </div>
  );
}
