import { useState } from "react";
import "./RepositoryCloneForm.css";

export function RepositoryCloneForm(): JSX.Element {
  const [url, setUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleValidate = async (): Promise<void> => {
    const result = await window.api.clone_repository(url);
    if (result.status === "error") {
      setError(result.message);
    }
  };

  return (
    <div className="repository-clone-form-card">
      <h2>Connect to an existing database</h2>
      <div className="repository-clone-form">
        <div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.currentTarget.value)}
          ></input>
          {error && <div className="form-validation-error">{error}</div>}
        </div>
        {
          <button type="button" onClick={handleValidate}>
            Connect
          </button>
        }
      </div>
    </div>
  );
}
