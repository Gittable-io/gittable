import "./SidebarList.css";

export type SidebarListProps = {
  children?: React.ReactNode;
  title?: string;
};

export function SidebarList({
  children,
  title,
}: SidebarListProps): JSX.Element {
  return (
    <div className="sidebar-list">
      {title && <h2>{title}</h2>}
      {children && <ul>{children}</ul>}
    </div>
  );
}
