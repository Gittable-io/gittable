import { SidebarSection } from "@renderer/components/ui-components/SidebarSection";
import "./SourceControl.css";
import { useEffect, useState } from "react";
import { TableMetadata } from "@sharedTypes/index";
import { List, ListItem } from "gittable-editor";

export type SourceControlProps = {
  repositoryId: string;
};

export function SourceControl({
  repositoryId,
}: SourceControlProps): JSX.Element {
  const [modifiedTables, setModifiedTables] = useState<TableMetadata[]>([]);

  useEffect(() => {
    const fetchChanges = async (): Promise<void> => {
      const response = await window.api.list_changes({ repositoryId });
      if (response.status === "success") {
        setModifiedTables(response.tableMetadataList);
      } else {
        console.error("[SourceControl] Couldn't retrieve changes");
      }
    };

    fetchChanges();

    const intervalId = setInterval(fetchChanges, 5000);

    return () => clearInterval(intervalId);
  }, [repositoryId]);

  return (
    <SidebarSection id="source-control" title="Source control">
      <List>
        <ListItem text="Changes" />
        <List subList>
          {modifiedTables.map((table) => (
            <ListItem
              key={table.id}
              text={table.name}
              materialSymbol="table"
            ></ListItem>
          ))}
        </List>
      </List>
    </SidebarSection>
  );
}
