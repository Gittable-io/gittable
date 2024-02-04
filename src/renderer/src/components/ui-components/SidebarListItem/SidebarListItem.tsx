import "./SidebarListItem.css";

export type SidebarListItemProps = {
  text: string;
  onClick?: () => void;
  action: {
    materialSymbol: string;
    onClick: () => void;
  };
};

export function SidebarListItem({
  text,
  onClick,
  action,
}: SidebarListItemProps): JSX.Element {
  return (
    <li className="sidebar-list-item">
      <div
        className={`text ${onClick ? "clickable" : ""}`}
        {...(onClick && { onClick: onClick })}
      >
        {text}
      </div>
      <span
        className="action-icon material-symbols-outlined"
        onClick={action.onClick}
      >
        {action.materialSymbol}
      </span>
    </li>
  );
}
