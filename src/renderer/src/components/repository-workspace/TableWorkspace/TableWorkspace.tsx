import { useEffect, useReducer } from "react";
import { TableEditor } from "gittable-editor";
import { reducer, initializeState } from "./state";
import { Spinner } from "@renderer/components/ui-components/Spinner";
import "./TableWorkspace.css";

type TableWorkspaceProps = {
  repositoryId: string;
  tableFileName: string;
};

export function TableWorkspace({
  repositoryId,
  tableFileName,
}: TableWorkspaceProps): JSX.Element {
  const [state, dispatch] = useReducer(reducer, initializeState());

  /**
   * @sideeffect Load data when mounting
   */

  useEffect(() => {
    console.debug(`[TableWorkspace/useEffect] Fetching table data`);
    dispatch({ type: "fetchingTableData", payload: {} });

    const fetchTableData = async (): Promise<void> => {
      const response = await window.api.get_table(repositoryId, tableFileName);

      if (response.status === "success") {
        dispatch({ type: "loadTableData", payload: response.table });
      } else {
        console.error(`[TableWorkspace] Error loading table data`);
      }
    };

    fetchTableData();
  }, [repositoryId, tableFileName]);

  /**
   * @sideeffect Save table data to file when modified
   * */
  useEffect(() => {
    if (state.tableData !== null && state.tableDataModified) {
      console.debug(`[TableWorkspace/useEffect] Saving data to file`);
      window.api.save_table(repositoryId, tableFileName, state.tableData);
      dispatch({ type: "tableDataSaved", payload: {} });
    }
    /*
      TODO: do I really need tableDataModified in the state and this dependency array?
      can't I just save data every time state.tableData is modified?
      especially that my reducer returns a new reference to tableData when it's modified 
      */
  }, [state.tableDataModified, repositoryId, tableFileName]);

  return (
    <div className="table-workspace">
      {state.fetchingTableData || state.tableData === null ? (
        <Spinner text="Loading table..." />
      ) : (
        <TableEditor table={state.tableData} onDataChange={dispatch} />
      )}
    </div>
  );
}
