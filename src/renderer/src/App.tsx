import { DatabaseSelectorCard } from "./components";
import { useState } from "react";
import { DatabaseWorkspace } from "./components";
import { Footer } from "./components/Footer/Footer";
import "./App.css";

function App(): JSX.Element {
  const [dbPath, setDbPath] = useState<string | null>(null);

  return (
    <div className="app-container">
      <main>
        {dbPath === null ? (
          <DatabaseSelectorCard onFileSelect={setDbPath} />
        ) : (
          <DatabaseWorkspace dbPath={dbPath} />
        )}
      </main>
      <Footer />
    </div>
  );
}

export default App;
