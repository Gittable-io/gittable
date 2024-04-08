import { useCallback } from "react";
import { TableEditor, type Table } from "gittable-editor";
import "./TableEditorPanel.css";
import type { TableMetadata } from "@sharedTypes/index";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, AppRootState } from "@renderer/store/store";
import { repoActions } from "@renderer/store/repoSlice";

type TableEditorPanelProps = {
  tableMetadata: TableMetadata;
  hidden?: boolean;
};

export function TableEditorPanel({
  tableMetadata,
  hidden,
}: TableEditorPanelProps): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();
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

  const saveTable = useCallback(
    async (tableData: Table) => {
      const response = await window.api.save_table({
        repositoryId,
        tableId: tableMetadata.id,
        tableData: tableData,
      });

      if (response.status === "success") {
        dispatch(repoActions.updateVersionContent());
      } else {
        throw new Error(
          `Error saving table data. repositoryId = ${repositoryId}, tableId=${tableMetadata.id}`,
        );
      }
    },
    [dispatch, repositoryId, tableMetadata.id],
  );

  return (
    <div className="table-editor-panel">
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
