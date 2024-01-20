import { useState } from "react";
import { DatabaseSelectorCard } from "./components";
import { DatabaseWorkspace } from "./components";
import { Footer } from "./components";
import "./App.css";

function App(): JSX.Element {
  const [dbPath, setDbPath] = useState<string | null>(null);

  return (
    <div className="app-container">
      <div className="main-container">
        {dbPath === null ? (
          <DatabaseSelectorCard onFileSelect={setDbPath} />
        ) : (
          <DatabaseWorkspace dbPath={dbPath} />
        )}
      </div>
      <Footer />
    </div>
  );
}

export default App;
