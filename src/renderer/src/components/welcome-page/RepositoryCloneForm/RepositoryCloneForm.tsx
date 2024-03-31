import { useState } from "react";
import "./RepositoryCloneForm.css";
import { Repository } from "@sharedTypes/index";
import { Spinner, InputAndValidation, Button } from "gittable-editor";

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
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [waitingForResponse, setWaitingForResponse] = useState(false);

  const handleValidate = async (): Promise<void> => {
    setWaitingForResponse(true);
    const response = await window.api.clone_repository({
      remoteUrl: url,
      ...(username !== "" || password != ""
        ? { credentials: { username, password } }
        : {}),
    });
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

  const handleUrlChange = (value: string): void => {
    setUrl(value);
    setError(null);
  };
  const handleUsernameChange = (value: string): void => {
    setUsername(value);
    setError(null);
  };
  const handlePasswordChange = (value: string): void => {
    setPassword(value);
    setError(null);
  };

  return (
    <div
      className="repository-clone-form"
      role="form"
      aria-label="Repository clone form"
    >
      <h2>Clone a remote repository</h2>
      <InputAndValidation
        placeholder="Repository URL"
        value={url}
        onChange={handleUrlChange}
        {...(error != null ? { error } : {})}
      />
      <div className="credentials">
        <h3>Credentials</h3>
        <InputAndValidation
          placeholder="Username"
          value={username}
          onChange={handleUsernameChange}
        />
        <InputAndValidation
          type="password"
          placeholder="Password"
          value={password}
          onChange={handlePasswordChange}
        />
      </div>
      <Button
        text="Clone"
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
