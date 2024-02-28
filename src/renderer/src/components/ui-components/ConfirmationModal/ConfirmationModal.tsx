import ReactModal from "react-modal";
import "./ConfirmationModal.css";
import { Button } from "gittable-editor";

export type ConfirmationModalProps = {
  title: string;
  text: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmationModal({
  title,
  text,
  onConfirm,
  onCancel,
}: ConfirmationModalProps): JSX.Element {
  return (
    <ReactModal
      className="confirmation-modal"
      overlayClassName="backdrop-modal"
      isOpen
    >
      <div className="modal-content">
        <h1>{title}</h1>
        <p>{text}</p>
        <div className="button-group">
          <Button text="Cancel" variant="outlined" onClick={onCancel} />
          <Button
            text="Delete repository"
            variant="danger"
            onClick={onConfirm}
          />
        </div>
      </div>
    </ReactModal>
  );
}
