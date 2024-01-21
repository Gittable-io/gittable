import { useEffect, useReducer } from "react";
import { TableEditor } from "gittable-editor";
import { reducer, initializeState } from "./state";

type DatabaseWorkspaceProps = {
  dbPath: string;
};

export function DatabaseWorkspace({
  dbPath,
}: DatabaseWorkspaceProps): JSX.Element {
  const [state, dispatch] = useReducer(reducer, initializeState());

  // Side effect: Load data when mounting
  useEffect(() => {
    console.debug(`[DatabaseWorkspace/useEffect] Loading data`);
    const loadTableData = async (): Promise<void> => {
      const tableData = await window.api.get_table(dbPath);
      console.debug(
        `[DatabaseWorkspace/useEffect/loadTableData] dispatching tableDataLoaded action`,
      );
      dispatch({ type: "tableDataLoaded", payload: tableData });
    };

    loadTableData();
  }, [dbPath]);

  // Side effect: Save data to file when modified
  useEffect(() => {
    if (state.tableData !== null && state.tableDataModified) {
      console.debug(`[DatabaseWorkspace/useEffect] Saving data to file`);
      window.api.post_table(dbPath, state.tableData);
      dispatch({ type: "tableDataSaved", payload: {} });
    }
  }, [dbPath, state]);

  return (
    <>
      {state.tableData !== null ? (
        <TableEditor table={state.tableData} onDataChange={dispatch} />
      ) : (
        <div>Loading...</div>
      )}
    </>
  );
}
