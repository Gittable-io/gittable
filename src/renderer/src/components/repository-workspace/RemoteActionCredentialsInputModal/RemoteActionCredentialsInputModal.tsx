import "./RemoteActionCredentialsInputModal.css";
import { Modal } from "../../ui-components/Modal";
import { Button, InputAndValidation } from "gittable-editor";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, AppRootState } from "@renderer/store/store";
import { repoActions } from "@renderer/store/repoSlice";

export function RemoteActionCredentialsInputModal(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  const currentRemoteAction = useSelector(
    (state: AppRootState) => state.repo.remoteActionSequence!,
  )!;

  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const confirm = (): void => {
    dispatch(
      repoActions.remoteAction({
        action: currentRemoteAction.action,
        credentials: { username, password },
      }),
    );
  };

  const cancel = (): void => {
    dispatch(repoActions.cancelRemoteAction());
  };

  const isConfirmDisabled: boolean = username === "" || password === "";

  const errorMessage =
    currentRemoteAction.step === "AUTH_ERROR"
      ? "Error authenticating with provided credentials"
      : null;

  return (
    <Modal>
      <div className="remote-action-credentials-input-modal">
        <h1>Credentials needed</h1>
        <p>You need to enter your credentials to share your changes</p>
        <div className="credentials-input-fields">
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          <InputAndValidation
            placeholder="Username"
            value={username}
            onChange={setUsername}
          />
          <InputAndValidation
            type="password"
            placeholder="Password or Personal Access Token"
            value={password}
            onChange={setPassword}
          />
        </div>
        <div className="button-group">
          <Button text="Cancel" variant="outlined" onClick={cancel} />
          <Button
            text="Push"
            variant="contained"
            disabled={isConfirmDisabled}
            onClick={confirm}
          />
        </div>
      </div>
    </Modal>
  );
}
