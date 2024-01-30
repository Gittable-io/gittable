import { useState } from "react";
import "./RepositoryCloneForm.css";

export function RepositoryCloneForm(): JSX.Element {
  const [url, setUrl] = useState<string>("");

  const handleValidate = (): void => {
    window.api.clone_repository(url);
  };

  return (
    <div className="repository-clone-form">
      <h2>Connect to an existing database</h2>
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.currentTarget.value)}
      ></input>
      <button onClick={handleValidate}>Connect</button>
    </div>
  );
}
