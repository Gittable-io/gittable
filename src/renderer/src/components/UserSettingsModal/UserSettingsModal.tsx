import { MaterialSymbol } from "gittable-editor";
import { Modal } from "../ui-components/Modal";
import "./UserSettingsModal.css";

export type UserSettingsModalProps = {
  onClose: () => void;
};

export function UserSettingsModal({
  onClose,
}: UserSettingsModalProps): JSX.Element {
  return (
    <Modal>
      <div className="user-settings-modal">
        <div className="title-section">
          <h1>User Settings</h1>
          <MaterialSymbol symbol="close" onClick={onClose} label="Close" />
        </div>
      </div>
    </Modal>
  );
}
