import { useCallback } from "react";
import { DiffDescription } from "../EditorPanelGroup";
import "./TableDiffViewerPanel.css";
import { Table, TableDiffViewer } from "gittable-editor";
import { useSelector } from "react-redux";
import { AppRootState } from "@renderer/store/store";

type TableDiffViewerPanelProps = {
  diffDescription: DiffDescription;
  hidden?: boolean;
};

export function TableDiffViewerPanel({
  diffDescription,
  hidden,
}: TableDiffViewerPanelProps): JSX.Element {
  const repositoryId = useSelector(
    (state: AppRootState) => state.repo.repository!.id,
  );

  const fetchFromTable = useCallback(async (): Promise<Table> => {
    const response = await window.api.get_table_data({
      repositoryId,
      tableId: diffDescription.table.id,
      ref: diffDescription.fromRef,
    });

    if (response.status !== "success") {
      throw new Error(
        `Error loading table data. repositoryId = ${repositoryId}, tableId=${diffDescription.table.id}, ref=${diffDescription.fromRef}`,
      );
    }
    return response.tableData;
  }, [repositoryId, diffDescription]);

  const fetchToTable = useCallback(async (): Promise<Table> => {
    const response = await window.api.get_table_data({
      repositoryId,
      tableId: diffDescription.table.id,
      ref: diffDescription.toRef,
    });

    if (response.status !== "success") {
      throw new Error(
        `Error loading table data. repositoryId = ${repositoryId}, tableId=${diffDescription.table.id}, ref=${diffDescription.toRef}`,
      );
    }

    return response.tableData;
  }, [repositoryId, diffDescription]);

  return (
    <div className="table-diff-viewer-panel">
      <TableDiffViewer
        fetchFromTable={fetchFromTable}
        fetchToTable={fetchToTable}
        watchExternalChanges
        hidden={hidden}
      />
    </div>
  );
}
