import { useDispatch, useSelector } from "react-redux";
import "./ReviewPanel.css";
import { AppDispatch, AppRootState } from "@renderer/store/store";
import { List, ListItem } from "gittable-editor";
import { repoActions } from "@renderer/store/repoSlice";

export function ReviewPanel(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  const content = useSelector(
    (state: AppRootState) => state.repo.checkedOutContent!,
  );

  const modifiedTables = content.tables.filter((table) => table.modified);

  return (
    <div className="review-panel">
      <div className="section-working-dir">
        <h2>Changes since your last commit</h2>
        <div>
          {modifiedTables.length > 0 ? (
            <List>
              {modifiedTables.map((table) => (
                <ListItem
                  key={table.id}
                  text={table.name}
                  materialSymbol="table"
                  onClick={() =>
                    dispatch(
                      repoActions.openPanel({
                        type: "diff",
                        diff: { table, fromRef: "HEAD", toRef: "WorkingDir" },
                      }),
                    )
                  }
                ></ListItem>
              ))}
            </List>
          ) : (
            <p>You don&apos;t have any changes</p>
          )}
        </div>
      </div>
      <div className="section-commits">
        <h2>Commits included in this version</h2>
      </div>
      <div className="section-version-changes">
        <h2>Changes from last published version</h2>
      </div>
    </div>
  );
}
