import { useState, useEffect } from "react";
import { SidebarList } from "../../ui-components/SidebarList";
import { RepositoryContentItem } from "../RepositoryContentItem";

export type RepositoryContentProps = {
  repositoryId: string;
  onTableSelect: (table: string) => void;
};

export function RepositoryContent({
  repositoryId,
  onTableSelect,
}: RepositoryContentProps): JSX.Element {
  const [tableFileNames, setTableFileNames] = useState<string[]>([]);

  const fetchTables = async (): Promise<void> => {
    const response = await window.api.list_tables(repositoryId);
    if (response.status === "success") {
      setTableFileNames(response.tableFileNames);
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
      {tableFileNames.map((tableFileName) => (
        <RepositoryContentItem
          key={tableFileName}
          tableName={tableFileName}
          onTableSelect={() => onTableSelect(tableFileName)}
        />
      ))}
    </SidebarList>
  );
}
