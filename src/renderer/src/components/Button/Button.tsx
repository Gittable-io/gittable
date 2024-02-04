import "./Button.css";

export type ButtonProps = {
  text: string;
  disabled: boolean;
  onClick: () => void; // TODO: or () => Promise<void>
};

export function Button({ text, disabled, onClick }: ButtonProps): JSX.Element {
  return (
    <button
      className="button"
      type="button"
      disabled={disabled}
      onClick={onClick}
    >
      {text}
    </button>
  );
}
