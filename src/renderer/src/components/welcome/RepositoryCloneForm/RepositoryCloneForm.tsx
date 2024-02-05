import { useState } from "react";
import "./RepositoryCloneForm.css";
import { Repository } from "@sharedTypes/index";
import { Button } from "../../ui-components/Button";
import { Spinner } from "@renderer/components/ui-components/Spinner";

type RepositoryCloneFormProps = {
  onRepositoryClone: (
    repository: Repository,
    alreadyExisting?: boolean,
  ) => void;
};

export function RepositoryCloneForm({
  onRepositoryClone,
}: RepositoryCloneFormProps): JSX.Element {
  const [url, setUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [waitingForResponse, setWaitingForResponse] = useState(false);

  const handleValidate = async (): Promise<void> => {
    setWaitingForResponse(true);
    const response = await window.api.clone_repository(url);
    console.debug(
      `[RepositoryCloneForm/handleValidate] clone_repository(${url}) returned: ${JSON.stringify(response)}`,
    );

    setWaitingForResponse(false);

    if (response.status === "error") {
      setError(response.message);
    } else if (response.status === "success") {
      onRepositoryClone(
        response.repository,
        response.type === "already cloned",
      );
    }
  };

  const handleInputChange = (e): void => {
    setUrl(e.currentTarget.value);
    setError(null);
  };

  return (
    <div className="repository-clone-form">
      <h2>Connect to an existing database</h2>
      <div className="input-and-validation">
        <input
          type="text"
          placeholder="Repository URL"
          value={url}
          onChange={handleInputChange}
        ></input>
        {error && <div className="validation-errors">{error}</div>}
      </div>
      <Button
        text="Connect"
        variant="contained"
        onClick={handleValidate}
        disabled={url.length === 0}
      />
      {waitingForResponse && (
        <div className="backdrop">
          <Spinner text="Connecting to repository..." />
        </div>
      )}
    </div>
  );
}
