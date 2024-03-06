import { useCallback } from "react";
import { TableEditor, type Table } from "gittable-editor";
import "./TableWorkspace.css";
import type { TableMetadata } from "@sharedTypes/index";

type TableWorkspaceProps = {
  repositoryId: string;
  tableMetadata: TableMetadata;
  hidden?: boolean;
};

export function TableWorkspace({
  repositoryId,
  tableMetadata,
  hidden,
}: TableWorkspaceProps): JSX.Element {
  const fetchTable = useCallback(async () => {
    const response = await window.api.get_table_data({
      repositoryId,
      tableId: tableMetadata.id,
    });

    if (response.status === "success") {
      return response.tableData;
    } else {
      throw new Error(
        `Error loading table data. repositoryId = ${repositoryId}, tableId=${tableMetadata.id}`,
      );
    }
  }, [repositoryId, tableMetadata.id]);

  const saveTable = useCallback(
    async (tableData: Table) => {
      const response = await window.api.save_table({
        repositoryId,
        tableId: tableMetadata.id,
        tableData: tableData,
      });

      if (response.status === "success") return;
      else
        throw new Error(
          `Error saving table data. repositoryId = ${repositoryId}, tableId=${tableMetadata.id}`,
        );
    },
    [repositoryId, tableMetadata.id],
  );

  return (
    <div className="table-workspace">
      <TableEditor
        key={tableMetadata.id}
        fetchTable={fetchTable}
        saveTable={saveTable}
        watchExternalChanges
        hidden={hidden}
      />
    </div>
  );
}
