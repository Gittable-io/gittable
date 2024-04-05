import { Button, InputAndValidation } from "gittable-editor";
import { Modal } from "../ui-components/Modal";
import "./UserSettingsModal.css";
import { useState } from "react";
import * as EmailValidator from "email-validator";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@renderer/store/store";
import { appActions } from "@renderer/store/appSlice";

export type UserSettingsModalProps = {
  onClose: () => void;
};

export function UserSettingsModal({
  onClose,
}: UserSettingsModalProps): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();
  const userGitConfig = useSelector(
    (state: RootState) => state.app.gitConfig.user,
  );

  const [gitUserName, setGitUserName] = useState(userGitConfig.name);
  const [gitUserEmail, setGitUserEmail] = useState(userGitConfig.email);

  const gitUserNameError: string | null =
    gitUserName.trim() === "" ? "Name should not be empty" : null;
  const gitUserEmailError: string | null =
    gitUserEmail.trim() === ""
      ? "Email should not be empty"
      : !EmailValidator.validate(gitUserEmail)
        ? "Email is invalid"
        : null;
  const canSave: boolean =
    gitUserNameError == null && gitUserEmailError == null;

  const saveUserSettings = async (): Promise<void> => {
    const response = await window.api.save_git_config({
      gitConfig: { user: { name: gitUserName, email: gitUserEmail } },
    });

    if (response.status === "success") {
      dispatch(appActions.setGitConfig(response.gitConfig));
      onClose();
    } else {
      console.error("[UserSettingsModal] Error saving git config");
    }
  };

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
                  label="User name"
                  {...(gitUserNameError != null
                    ? { error: gitUserNameError }
                    : {})}
                />
              </div>
              <div className="label-and-input">
                <label>User email</label>
                <InputAndValidation
                  value={gitUserEmail}
                  label="User email"
                  onChange={setGitUserEmail}
                  {...(gitUserEmailError != null
                    ? { error: gitUserEmailError }
                    : {})}
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
          <Button
            text="Save"
            variant="contained"
            onClick={saveUserSettings}
            disabled={!canSave}
          />
        </div>
      </div>
    </Modal>
  );
}
