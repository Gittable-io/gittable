import { useReducer } from "react";
import { Table, TableDataUpdateAction } from "gittable-editor";
import { TableEditor } from "gittable-editor";

type TableManagerProps = {
  initialTable: Table;
};

const reducer = (state: Table, action: TableDataUpdateAction): Table => {
  switch (action.type) {
    case "cellValueChanged": {
      const { row, col, newValue } = action.payload;
      return {
        ...state,
        records: state.records.map((r, rIdx) =>
          rIdx === row
            ? [...r.slice(0, col), newValue, ...r.slice(col + 1)]
            : r,
        ),
      };
    }
    default:
      return state;
  }
};

export function TableManager({ initialTable }: TableManagerProps) {
  const [data, dispatch] = useReducer(reducer, initialTable);

  const handleChange = (action: TableDataUpdateAction) => {
    console.info(
      `[TableManagerMock] Action dispatched: ${JSON.stringify(action, null, 2)}`,
    );
    dispatch(action);
  };

  return <TableEditor table={data} onDataChange={handleChange} />;
}
