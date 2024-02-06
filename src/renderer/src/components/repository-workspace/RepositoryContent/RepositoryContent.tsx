import { useState, useEffect } from "react";
import { SidebarList } from "../../ui-components/SidebarList";
import { RepositoryContentItem } from "../RepositoryContentItem";
import { TableMetadata } from "@sharedTypes/index";

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

  const fetchTables = async (): Promise<void> => {
    const response = await window.api.list_tables({ repositoryId });
    if (response.status === "success") {
      setTableMetadataList(response.tableMetadataList);
    } else {
      console.error("[RepositoryContent] Couldn't retrieve table list");
    }
  };

  /**
   * @sideeffect  : at start load table list
   */
  useEffect(() => {
    fetchTables();
  }, []);

  return (
    <SidebarList title="Tables">
      {tableMetadataList.map((tableMetadata) => (
        <RepositoryContentItem
          key={tableMetadata.id}
          tableName={tableMetadata.name}
          onTableSelect={() => onTableSelect(tableMetadata)}
        />
      ))}
    </SidebarList>
  );
}
