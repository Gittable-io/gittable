import { useState, useEffect } from "react";
import { RepositoryContentItem } from "../RepositoryContentItem";
import { TableMetadata } from "@sharedTypes/index";
import { List } from "gittable-editor";
import "./RepositoryContent.css";
import { SidebarSection } from "@renderer/components/ui-components/SidebarSection";

export type RepositoryContentProps = {
  repositoryId: string;
  onTableSelect: (tableMetadata: TableMetadata) => void;
};

export function RepositoryContent({
  repositoryId,
  onTableSelect,
}: RepositoryContentProps): JSX.Element {
  const [tableMetadataList, setTableMetadataList] = useState<TableMetadata[]>(
    [],
  );

  /**
   * @sideeffect  : at start load table list
   */
  useEffect(() => {
    const fetchTables = async (): Promise<void> => {
      const response = await window.api.list_tables({ repositoryId });
      if (response.status === "success") {
        setTableMetadataList(response.tableMetadataList);
      } else {
        console.error("[RepositoryContent] Couldn't retrieve table list");
      }
    };

    fetchTables();
  }, [repositoryId]);

  return (
    <SidebarSection id="repository-content" title="Tables">
      <List>
        {tableMetadataList.map((tableMetadata) => (
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
