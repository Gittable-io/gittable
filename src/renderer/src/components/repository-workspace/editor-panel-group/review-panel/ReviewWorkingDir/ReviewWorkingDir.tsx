import { useDispatch, useSelector } from "react-redux";
import "./ReviewWorkingDir.css";
import { AppDispatch, AppRootState } from "@renderer/store/store";
import { Button, List, ListItem } from "gittable-editor";
import { repoActions } from "@renderer/store/repoSlice";

export function ReviewWorkingDir(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  const content = useSelector(
    (state: AppRootState) => state.repo.checkedOutContent!,
  );

  const modifiedTables = content.tables.filter((table) => table.modified);

  return (
    <div className="review-working-dir">
      <h2>Changes since your last commit</h2>
      <div className="review-working-dir-actions">
        <Button text="Discard changes" variant="outlined" onClick={() => {}} />
      </div>
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
  );
}
