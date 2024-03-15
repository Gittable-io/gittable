import { useCallback, useEffect, useState } from "react";
import { DiffDescription } from "../EditorPanelGroup";
import "./TableDiffViewerPanel.css";
import { Table, TableDiffViewer } from "gittable-editor";

type TableDiffViewerPanelProps = {
  repositoryId: string;
  diffDescription: DiffDescription;
};

export function TableDiffViewerPanel({
  repositoryId,
  diffDescription,
}: TableDiffViewerPanelProps): JSX.Element {
  const [from, setFrom] = useState<Table | null>(null);
  const [to, setTo] = useState<Table | null>(null);

  const fetchTableData = useCallback(async (): Promise<[Table, Table]> => {
    const responseFrom = await window.api.get_table_data({
      repositoryId,
      tableId: diffDescription.table.id,
      ref: diffDescription.from,
    });

    if (responseFrom.status !== "success") {
      throw new Error(
        `Error loading table data. repositoryId = ${repositoryId}, tableId=${diffDescription.table.id}, ref=${diffDescription.from}`,
      );
    }

    const responseTo = await window.api.get_table_data({
      repositoryId,
      tableId: diffDescription.table.id,
      ref: diffDescription.to,
    });

    if (responseTo.status !== "success") {
      throw new Error(
        `Error loading table data. repositoryId = ${repositoryId}, tableId=${diffDescription.table.id}, ref=${diffDescription.to}`,
      );
    }

    return [responseFrom.tableData, responseTo.tableData];
  }, [repositoryId, diffDescription]);

  useEffect(() => {
    async function fetchData(): Promise<void> {
      const tables = await fetchTableData();
      setFrom(tables[0]);
      setTo(tables[1]);
    }
    fetchData();
  }, [fetchTableData]);

  return (
    <div className="table-diff-viewer-panel">
      {from != null && to != null && (
        <TableDiffViewer fromTable={from} toTable={to} />
      )}{" "}
    </div>
  );
}
