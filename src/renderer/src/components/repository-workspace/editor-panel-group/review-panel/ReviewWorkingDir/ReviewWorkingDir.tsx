import { useDispatch, useSelector } from "react-redux";
import "./ReviewWorkingDir.css";
import { AppDispatch, AppRootState } from "@renderer/store/store";
import { Button, InputAndValidation, List, ListItem } from "gittable-editor";
import { repoActions } from "@renderer/store/repoSlice";
import { useModal } from "react-modal-hook";
import { ConfirmationModal } from "@renderer/components/ui-components/ConfirmationModal";
import { useState } from "react";
import { DocumentChangeType } from "@sharedTypes/index";

const getChangeAbbreviation = (change: DocumentChangeType): string => {
  switch (change) {
    case "added":
      return "(A)";
    case "deleted":
      return "(D)";
    case "modified":
      return "(M)";
    default:
      return "";
  }
};

export function ReviewWorkingDir(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  const tables = useSelector(
    (state: AppRootState) => state.repo.currentVersionContent!.tables,
  );
  const discardInProgress = useSelector(
    (state: AppRootState) => state.repo.progress.discardInProgress,
  );
  const commitInProgress = useSelector(
    (state: AppRootState) => state.repo.progress.commitInProgress,
  );

  const [commitMessage, setCommitMessage] = useState<string>("");

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

  const commit = (): void => {
    dispatch(repoActions.commit(commitMessage));
    setCommitMessage("");
  };

  const changedTables = tables.filter((table) => table.change !== "none");
  const isWorkingDirModified = changedTables.length > 0;
  const canCommit = isWorkingDirModified && commitMessage !== "";

  return (
    <div className="review-working-dir">
      <h2>Changes since your last commit</h2>
      <div className="review-working-dir-actions">
        <Button
          text="Discard changes"
          variant="outlined"
          disabled={!isWorkingDirModified}
          onClick={showDiscardChangesModal}
          loading={discardInProgress}
        />
        <div className="review-working-dir-commit">
          <InputAndValidation
            value={commitMessage}
            onChange={setCommitMessage}
            placeholder="Describe your commit"
            maxLength={72}
          />
          <Button
            text="Commit changes"
            variant="outlined"
            disabled={!canCommit}
            onClick={commit}
            loading={commitInProgress}
          />
        </div>
      </div>
      <div>
        {isWorkingDirModified ? (
          <List>
            {changedTables.map((table) => (
              <ListItem
                key={table.id}
                text={`${table.name} ${getChangeAbbreviation(table.change)}`}
                materialSymbol="table"
                {...(table.change === "modified"
                  ? {
                      onClick: () =>
                        dispatch(
                          repoActions.openPanel({
                            type: "diff",
                            diff: {
                              table,
                              fromRef: "HEAD",
                              toRef: "WorkingDir",
                            },
                          }),
                        ),
                    }
                  : {})}
              />
            ))}
          </List>
        ) : (
          <p>You don&apos;t have any changes</p>
        )}
      </div>
    </div>
  );
}
