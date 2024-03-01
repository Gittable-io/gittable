import { ListItem } from "gittable-editor";

export type RepositoryContentItemProps = {
  tableName: string;
  onTableSelect: () => void;
};

export function RepositoryContentItem({
  tableName,
  onTableSelect,
}: RepositoryContentItemProps): JSX.Element {
  return (
    <ListItem text={tableName} materialSymbol="table" onClick={onTableSelect} />
  );
}
