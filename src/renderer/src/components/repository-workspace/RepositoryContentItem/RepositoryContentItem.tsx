import { SidebarListItem } from "@renderer/components/ui-components/SidebarListItem";

export type RepositoryContentItemProps = {
  tableName: string;
  onTableSelect: () => void;
};

export function RepositoryContentItem({
  tableName,
  onTableSelect,
}: RepositoryContentItemProps): JSX.Element {
  return (
    <SidebarListItem
      text={tableName}
      materialSymbol="table"
      onClick={onTableSelect}
    />
  );
}
