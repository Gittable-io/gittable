import "./SidebarListItem.css";

export type SidebarListItemProps = {
  text: string;
  onClick?: () => void;
  action: {
    materialIcon: string;
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
        className="action-icon material-icons md-18 delete-button"
        onClick={action.onClick}
      >
        {action.materialIcon}
      </span>
    </li>
  );
}
