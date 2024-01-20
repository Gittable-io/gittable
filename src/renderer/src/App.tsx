import Versions from "./components/Versions";
import { DatabaseSelectorCard } from "./components";
import { useState } from "react";
import { DatabaseWorkspace } from "./components";

function App(): JSX.Element {
  const [dbPath, setDbPath] = useState<string | null>(null);

  return (
    <div className="container">
      <Versions></Versions>
      {dbPath === null ? (
        <DatabaseSelectorCard onFileSelect={setDbPath} />
      ) : (
        <DatabaseWorkspace dbPath={dbPath} />
      )}
    </div>
  );
}

export default App;
