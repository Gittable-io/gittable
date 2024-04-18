import { useState } from "react";
import "./NewTableForm.css";
import {
  InputAndValidation,
  MaterialSymbol,
  MaterialSymbolButton,
  Spinner,
} from "gittable-editor";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, AppRootState } from "@renderer/store/store";
import { repoActions } from "@renderer/store/repoSlice";

export function NewTableForm(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  const [tableName, setTableName] = useState<string>("");

  const versionContent = useSelector(
    (state: AppRootState) => state.repo.currentVersionContent!,
  );
  const newTableSendingRequest = useSelector(
    (state: AppRootState) =>
      state.repo.progress.addTable === "WAITING_FOR_REQUEST",
  );

  const tableExists = (tableName: string): boolean => {
    return versionContent.tables.some((t) => t.name === tableName);
  };

  const addTable = (): void => {
    setTableName("");

    dispatch(repoActions.addTable(tableName));
  };

  const error: string | null =
    tableName !== "" && tableExists(tableName) ? "Table already exists" : null;

  return (
    <div className="new-table-form">
      <MaterialSymbol symbol="table" />
      <InputAndValidation
        value={tableName}
        placeholder="New table name"
        {...(error ? { error } : {})}
        onChange={setTableName}
      />
      {!newTableSendingRequest ? (
        <MaterialSymbolButton
          symbol="check"
          disabled={error != null || tableName === ""}
          onClick={addTable}
        />
      ) : (
        <Spinner inline />
      )}
    </div>
  );
}
