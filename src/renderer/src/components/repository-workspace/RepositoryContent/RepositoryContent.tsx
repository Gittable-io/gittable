import { RepositoryContentItem } from "../RepositoryContentItem";
import { RepositoryStatus, TableMetadata } from "@sharedTypes/index";
import { List } from "gittable-editor";
import "./RepositoryContent.css";
import { SidebarSection } from "@renderer/components/ui-components/SidebarSection";

export type RepositoryContentProps = {
  repositoryId: string;
  repositoryStatus: RepositoryStatus;
  onTableSelect: (tableMetadata: TableMetadata) => void;
};

export function RepositoryContent({
  repositoryStatus,
  onTableSelect,
}: RepositoryContentProps): JSX.Element {
  return (
    <SidebarSection id="repository-content" title="Tables">
      <List>
        {repositoryStatus.tables.map((tableMetadata) => (
          <RepositoryContentItem
            key={tableMetadata.id}
            tableName={tableMetadata.name}
            onTableSelect={() => onTableSelect(tableMetadata)}
          />
        ))}
      </List>
    </SidebarSection>
  );
}
