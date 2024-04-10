import "./CredentialsInputModal.css";
import { Modal } from "../../../ui-components/Modal";
import { Button, InputAndValidation } from "gittable-editor";
import { RepositoryCredentials } from "@sharedTypes/index";
import { useState } from "react";

export type CredentialsInputModalProps = {
  authError?: boolean;
  onConfirm: (credentials: RepositoryCredentials) => void;
  onCancel: () => void;
};

export function CredentialsInputModal({
  authError,
  onConfirm,
  onCancel,
}: CredentialsInputModalProps): JSX.Element {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const confirm = (): void => {
    onConfirm({ username, password });
  };

  const isConfirmDisabled: boolean = username === "" || password === "";

  const errorMessage = authError
    ? "Error authenticating with provided credentials"
    : null;

  return (
    <Modal>
      <div className="credentials-input-modal">
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
          <Button text="Cancel" variant="outlined" onClick={onCancel} />
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
