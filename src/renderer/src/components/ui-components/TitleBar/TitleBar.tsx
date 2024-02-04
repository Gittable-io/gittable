import "./TitleBar.css";

export type TitleBarProps = {
  title: string;
  action?: {
    materialSymbol: string;
    onClick: () => void;
  };
};

export function TitleBar({ title, action }: TitleBarProps): JSX.Element {
  return (
    <div className="title-bar">
      <h1>{title}</h1>
      {action && (
        <span
          className="action-icon material-symbols-outlined"
          onClick={action.onClick}
        >
          {action.materialSymbol}
        </span>
      )}
    </div>
  );
}
