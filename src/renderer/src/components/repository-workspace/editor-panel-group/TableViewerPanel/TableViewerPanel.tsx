import { useCallback } from "react";
import { TableViewer } from "gittable-editor";
import "./TableViewerPanel.css";
import type { TableMetadata } from "@sharedTypes/index";
import { useSelector } from "react-redux";
import { AppRootState } from "@renderer/store/store";

type TableViewerPanelProps = {
  tableMetadata: TableMetadata;
  hidden?: boolean;
};

export function TableViewerPanel({
  tableMetadata,
  hidden,
}: TableViewerPanelProps): JSX.Element {
  const repositoryId = useSelector(
    (state: AppRootState) => state.repo.repository!.id,
  );

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

  return (
    <div className="table-viewer-panel">
      <TableViewer
        key={tableMetadata.id}
        fetchTable={fetchTable}
        hidden={hidden}
      />
    </div>
  );
}
