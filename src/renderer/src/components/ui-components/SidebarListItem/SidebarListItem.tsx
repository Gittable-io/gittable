import { IconAndText } from "../IconAndText";
import "./SidebarListItem.css";

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
        <span
          className="action-icon material-symbols-outlined"
          onClick={action.onClick}
        >
          {action.materialSymbol}
        </span>
      )}
    </li>
  );
}
