import ReactModal from "react-modal";
import "./Modal.css";

export type ModalProps = {
  children: React.ReactNode;
};

export function Modal({ children }: ModalProps): JSX.Element {
  return (
    <ReactModal className="modal" overlayClassName="backdrop-modal" isOpen>
      {children}
    </ReactModal>
  );
}
