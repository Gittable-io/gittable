import { useState } from "react";
import "./RepositoryCloneForm.css";

export function RepositoryCloneForm(): JSX.Element {
  const [url, setUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleValidate = async (): Promise<void> => {
    const result = await window.api.clone_repository(url);
    console.debug(
      `[RepositoryCloneForm/handleValidate] clone_repository(${url}) returned: ${JSON.stringify(result)}`,
    );
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
          <button
            type="button"
            onClick={handleValidate}
            disabled={url.length === 0}
          >
            Connect
          </button>
        }
      </div>
    </div>
  );
}
