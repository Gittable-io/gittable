import { useEffect, useReducer } from "react";
import { TableEditor, Table, TableDataUpdateAction } from "gittable-editor";

type DatabaseWorkspaceProps = {
  dbPath: string;
};

type TableDataLoadAction = {
  type: "tableDataLoaded";
  payload: Table;
};

type TableDataState = Table | null;

const tableReducer = (
  curState: TableDataState,
  action: TableDataLoadAction | TableDataUpdateAction,
): TableDataState => {
  console.debug(
    `[DatabaseWorkspace/tableReducer]: Received action: ${action.type}`,
  );
  if (curState === null) {
    switch (action.type) {
      case "tableDataLoaded": {
        return action.payload;
      }
      default: {
        console.warn(
          `Received ${action.type} action AND (state === null). This should not occur`,
        );
        return curState;
      }
    }
  } else {
    switch (action.type) {
      case "cellValueChanged": {
        const { row, col, newValue } = action.payload;
        return {
          ...curState,
          records: curState.records.map((r, rIdx) =>
            rIdx === row
              ? [...r.slice(0, col), newValue, ...r.slice(col + 1)]
              : r,
          ),
        };
      }
      case "tableDataLoaded": {
        console.warn(
          `Received ${action.type} action AND (state !== null). This should not occur`,
        );
        return curState;
      }
      default: {
        console.warn(
          `Received unknown action: ${action.type}. This should not occur`,
        );
        return curState;
      }
    }
  }
};

export function DatabaseWorkspace({
  dbPath,
}: DatabaseWorkspaceProps): JSX.Element {
  const [tableData, dispatchTableDataChange] = useReducer<
    React.Reducer<TableDataState, TableDataLoadAction | TableDataUpdateAction>
  >(tableReducer, null);

  // Side effect: Load data when mounting
  useEffect(() => {
    console.debug(`[DatabaseWorkspace/useEffect] Loading data`);
    const loadTableData = async (): Promise<void> => {
      const tableData = await window.api.get_table(dbPath);
      console.debug(
        `[DatabaseWorkspace/useEffect/loadTableData] dispatching tableDataLoaded action`,
      );
      dispatchTableDataChange({ type: "tableDataLoaded", payload: tableData });
    };

    loadTableData();
  }, [dbPath]);

  return (
    <div>
      {tableData !== null ? (
        <TableEditor table={tableData} onDataChange={dispatchTableDataChange} />
      ) : (
        "Loading..."
      )}
    </div>
  );
}
