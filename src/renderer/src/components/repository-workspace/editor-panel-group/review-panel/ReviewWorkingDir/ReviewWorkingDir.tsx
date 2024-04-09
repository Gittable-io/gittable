import { useDispatch, useSelector } from "react-redux";
import "./ReviewWorkingDir.css";
import { AppDispatch, AppRootState } from "@renderer/store/store";
import { Button, List, ListItem } from "gittable-editor";
import { repoActions } from "@renderer/store/repoSlice";
import { useModal } from "react-modal-hook";
import { ConfirmationModal } from "@renderer/components/ui-components/ConfirmationModal";

export function ReviewWorkingDir(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  const content = useSelector(
    (state: AppRootState) => state.repo.checkedOutContent!,
  );

  const [showDiscardChangesModal, hideDiscardChangesModal] = useModal(() => (
    <ConfirmationModal
      title="Discarding changes"
      text={`Are you sure you want to discard all your uncommited changes?`}
      confirmButtonLabel="Discard changes"
      onConfirm={discardChanges}
      onCancel={hideDiscardChangesModal}
    />
  ));

  const discardChanges = (): void => {
    hideDiscardChangesModal();
    dispatch(repoActions.discardChanges());
  };

  const modifiedTables = content.tables.filter((table) => table.modified);
  const isWorkingDirModified = modifiedTables.length > 0;

  return (
    <div className="review-working-dir">
      <h2>Changes since your last commit</h2>
      <div className="review-working-dir-actions">
        <Button
          text="Discard changes"
          variant="outlined"
          disabled={!isWorkingDirModified}
          onClick={showDiscardChangesModal}
        />
      </div>
      <div>
        {isWorkingDirModified ? (
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
