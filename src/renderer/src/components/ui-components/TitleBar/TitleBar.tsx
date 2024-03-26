import "./TitleBar.css";
import { MaterialSymbol } from "gittable-editor";

export type TitleBarProps = {
  title: string;
  action?: {
    materialSymbol: string;
    onClick: () => void;
    label?: string;
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
          {...(action.label ? { label: action.label } : {})}
        />
      )}
    </div>
  );
}
