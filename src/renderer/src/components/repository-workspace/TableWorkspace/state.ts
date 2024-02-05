import { Table, TableDataUpdateAction, tableReducer } from "gittable-editor";

/**
 * State definition
 */

export type TableWorkspaceState = {
  fetchingTableData: boolean;
  tableData: Table | null;
  tableDataModified: boolean;
};

/**
 * Action definitions
 */
export type TableWorkspaceActions =
  | TableDataUpdateAction
  | {
      type: "fetchingTableData";
      payload: Record<string, never>; // No payload. Record<string, never> is used in TS to represent an empty object {};
    }
  | {
      type: "loadTableData";
      payload: Table;
    }
  | {
      type: "tableDataSaved";
      payload: Record<string, never>; // No payload. Record<string, never> is used in TS to represent an empty object {}
    };

/**
 * Reducer definition
 */
export const reducer = (
  curState: TableWorkspaceState,
  action: TableWorkspaceActions,
): TableWorkspaceState => {
  console.debug(`[TableWorkspace/reducer]: Received action: ${action.type}`);

  switch (action.type) {
    case "fetchingTableData": {
      return { ...curState, fetchingTableData: true };
    }
    case "loadTableData": {
      return {
        fetchingTableData: false,
        tableData: action.payload,
        tableDataModified: false,
      };
    }
    case "changeCellValue":
    case "newRecord":
      if (curState.tableData !== null) {
        return {
          ...curState,
          tableData: tableReducer(curState.tableData, action),
          tableDataModified: true,
        };
      } else {
        console.warn(
          `[TableWorkspace/state] Received a ${action.type} action, but state.tableData === null. This should not occur`,
        );
        return curState;
      }
    case "tableDataSaved": {
      return {
        ...curState,
        tableDataModified: false,
      };
    }
  }
};

export const initializeState = (): TableWorkspaceState => {
  return {
    fetchingTableData: true,
    tableData: null,
    tableDataModified: false,
  };
};
