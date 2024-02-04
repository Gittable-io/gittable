import { useState, useEffect } from "react";
import { SidebarList } from "../../ui-components/SidebarList";
import { RepositoryContentItem } from "../RepositoryContentItem";

export type RepositoryContentProps = {
  repositoryId: string;
};

export function RepositoryContent({
  repositoryId,
}: RepositoryContentProps): JSX.Element {
  const [tables, setTables] = useState<string[]>([]);

  const fetchTables = async (): Promise<void> => {
    const response = await window.api.list_tables(repositoryId);
    if (response.status === "success") {
      setTables(response.tables);
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
      {tables.map((table) => (
        <RepositoryContentItem key={table} table={table} />
      ))}
    </SidebarList>
  );
}
