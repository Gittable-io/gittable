import "./TitleBar.css";

export type TitleBarProps = {
  title: string;
  action?: {
    materialSymbol: string;
    onClick: () => void;
    testId?: string;
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
          {...(action.testId ? { "data-testid": action.testId } : {})}
        >
          {action.materialSymbol}
        </span>
      )}
    </div>
  );
}
