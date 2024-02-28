import "./TitleBar.css";
import { MaterialSymbol } from "gittable-editor";

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
        <MaterialSymbol
          symbol={action.materialSymbol}
          onClick={action.onClick}
          {...(action.testId ? { testId: action.testId } : {})}
        />
      )}
    </div>
  );
}
