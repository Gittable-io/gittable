import { Button, InputAndValidation } from "gittable-editor";
import { Modal } from "../ui-components/Modal";
import "./UserSettingsModal.css";
import { useEffect, useState } from "react";

export type UserSettingsModalProps = {
  onClose: () => void;
  onGitConfigChange: () => Promise<void>;
};

export function UserSettingsModal({
  onClose,
  onGitConfigChange,
}: UserSettingsModalProps): JSX.Element {
  const [gitUserName, setGitUserName] = useState("");
  const [gitUserEmail, setGitUserEmail] = useState("");

  const saveUserSettings = async (): Promise<void> => {
    await window.api.save_git_config({
      gitConfig: { user: { name: gitUserName, email: gitUserEmail } },
    });

    onGitConfigChange();
    onClose();
  };

  const fetchGitConfig = async (): Promise<void> => {
    const response = await window.api.get_git_config();
    setGitUserName(response.gitConfig.user.name);
    setGitUserEmail(response.gitConfig.user.email);
  };

  useEffect(() => {
    fetchGitConfig();
  }, []);

  return (
    <Modal>
      <div className="user-settings-modal">
        <h1>User Settings</h1>
        <div className="user-settings-forms">
          <div className="user-settings-form-section">
            <div className="user-settings-form">
              <div className="label-and-input">
                <label>User name</label>
                <InputAndValidation
                  value={gitUserName}
                  onChange={setGitUserName}
                />
              </div>
              <div className="label-and-input">
                <label>User email</label>
                <InputAndValidation
                  value={gitUserEmail}
                  onChange={setGitUserEmail}
                />
              </div>
            </div>
            <div className="user-settings-form-information">
              <p>
                The user <strong>name</strong> and <strong>email</strong> will
                be attached to your contributions to correctly identify you as
                the author.
              </p>
              <p>
                <em>Unsure about which name and email to use?</em>
                <br />
                It&apos;s generally best to use your professional name and email
                address associated with your company account.
              </p>
              <p>
                <em>Still uncertain?</em>
                <br />
                Consult you Git administrator or IT department for the
                recommended <code>user.name</code> and &nbsp;
                <code>user.email</code> Git configuration.
              </p>
            </div>
          </div>
        </div>
        <div className="button-group">
          <Button text="Cancel" variant="outlined" onClick={onClose} />
          <Button text="Save" variant="contained" onClick={saveUserSettings} />
        </div>
      </div>
    </Modal>
  );
}
