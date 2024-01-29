import { Table, TableDataUpdateAction, tableReducer } from "gittable-editor";

/**
 * State definition
 */

export type DatabaseWorkspaceState = {
  tableData: Table | null;
  tableDataModified: boolean;
};

/**
 * Action definitions
 */
export type DatabaseWorkspaceActions =
  | TableDataUpdateAction
  | {
      type: "tableDataLoaded";
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
  curState: DatabaseWorkspaceState,
  action: DatabaseWorkspaceActions,
): DatabaseWorkspaceState => {
  console.debug(`[DatabaseWorkspace/reducer]: Received action: ${action.type}`);

  if (curState.tableData === null) {
    switch (action.type) {
      case "tableDataLoaded": {
        return { tableData: action.payload, tableDataModified: false };
      }
      default: {
        console.warn(
          `Received ${action.type} action AND (state.tableData === null). This should not occur`,
        );
        return curState;
      }
    }
  } else {
    switch (action.type) {
      case "changeCellValue":
      case "newRecord":
        return {
          ...curState,
          tableData: tableReducer(curState.tableData, action),
          tableDataModified: true,
        };
      case "tableDataSaved": {
        return {
          ...curState,
          tableDataModified: false,
        };
      }
      case "tableDataLoaded": {
        console.warn(
          `Received ${action.type} action AND (state.tableData !== null). This should not occur`,
        );
        return curState;
      }
    }
  }
};

export const initializeState = (): DatabaseWorkspaceState => {
  return {
    tableData: null,
    tableDataModified: false,
  };
};
