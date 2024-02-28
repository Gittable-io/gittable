import { IconAndText } from "gittable-editor";
import "./SidebarListItem.css";
import { MaterialSymbol } from "gittable-editor";

export type SidebarListItemProps = {
  text: string;
  materialSymbol?: string;
  onClick?: () => void;
  action?: {
    materialSymbol: string;
    onClick: () => void;
  };
};

export function SidebarListItem({
  text,
  materialSymbol,
  onClick,
  action,
}: SidebarListItemProps): JSX.Element {
  return (
    <li className="sidebar-list-item">
      <div
        className={`text ${onClick ? "clickable" : ""}`}
        {...(onClick && { onClick: onClick })}
      >
        <IconAndText text={text} {...(materialSymbol && { materialSymbol })} />
      </div>
      {action && (
        <MaterialSymbol
          symbol={action.materialSymbol}
          onClick={action.onClick}
          className="secondary-action"
        />
      )}
    </li>
  );
}
