import { useState } from "react";
import "./RepositoryCloneForm.css";
import { Spinner, InputAndValidation, Button } from "gittable-editor";
import { appActions } from "@renderer/store/appSlice";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@renderer/store/store";

export function RepositoryCloneForm(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

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
      // If the repository wasn't already cloned
      if (response.type === "cloned") {
        dispatch(appActions.addRepository(response.repository));
      }

      dispatch(appActions.openRepository(response.repository));
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
          placeholder="Password or Personal Access Token"
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
