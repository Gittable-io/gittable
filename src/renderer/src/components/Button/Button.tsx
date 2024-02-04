import "./Button.css";

type ButtonVariant = "contained" | "outlined" | "danger";

export type ButtonProps = {
  text: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  onClick: () => void; // TODO: or () => Promise<void> instead?
};

export function Button({
  text,
  variant = "contained",
  disabled = false,
  onClick,
}: ButtonProps): JSX.Element {
  return (
    <button
      className={`button ${variant}`}
      type="button"
      disabled={disabled}
      onClick={onClick}
    >
      {text}
    </button>
  );
}
