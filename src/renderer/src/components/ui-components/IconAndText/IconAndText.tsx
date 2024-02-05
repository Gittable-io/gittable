import "./IconAndText.css";

export type IconAndTextProps = {
  text: string;
  materialSymbol?: string;
};

export function IconAndText({
  text,
  materialSymbol,
}: IconAndTextProps): JSX.Element {
  return (
    <div className="icon-and-text">
      {materialSymbol && (
        <span className="icon material-symbols-outlined">{materialSymbol}</span>
      )}
      <div className="text">{text}</div>
    </div>
  );
}
