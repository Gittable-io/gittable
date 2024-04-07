import "./SidebarSection.css";

export type SidebarSectionProps = {
  id?: string;
  title?: string;
  children: React.ReactNode;
};

export function SidebarSection({
  id,
  title,
  children,
}: SidebarSectionProps): JSX.Element {
  return (
    <div {...(id ? { id } : {})} className="sidebar-section" aria-label={title}>
      {title && <div className="section-title">{title}</div>}
      <div className="section-content">{children}</div>
    </div>
  );
}
