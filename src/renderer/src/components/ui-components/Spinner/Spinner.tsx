import "./Spinner.css";

export type SpinnerProps = {
  text?: string;
};

export function Spinner({ text }: SpinnerProps): JSX.Element {
  return (
    <div className="spinner" data-testid="spinner">
      <div className="spinner-visual"></div>
      {text && <div className="text">{text}</div>}
    </div>
  );
}
