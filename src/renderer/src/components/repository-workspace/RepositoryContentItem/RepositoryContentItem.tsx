import { SidebarListItem } from "@renderer/components/ui-components/SidebarListItem";

export type RepositoryContentItemProps = {
  table: string;
};

export function RepositoryContentItem({
  table,
}: RepositoryContentItemProps): JSX.Element {
  return <SidebarListItem text={table} />;
}
