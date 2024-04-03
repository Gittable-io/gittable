import "./CredentialsInputModal.css";
import { Modal } from "../../../ui-components/Modal";
import { Button, InputAndValidation } from "gittable-editor";
import { RepositoryCredentials } from "@sharedTypes/index";
import { useState } from "react";

export type CredentialsInputModalProps = {
  errorMessage: string | null;
  onConfirm: (credentials: RepositoryCredentials) => void;
  onCancel: () => void;
};

export function CredentialsInputModal({
  errorMessage,
  onConfirm,
  onCancel,
}: CredentialsInputModalProps): JSX.Element {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const confirm = (): void => {
    onConfirm({ username, password });
  };

  const isConfirmDisabled: boolean = username === "" || password === "";

  return (
    <Modal>
      <div className="credentials-input-modal">
        <h1>Enter credentials</h1>
        <p>{errorMessage ?? "NO MESSAGE"}</p>
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
