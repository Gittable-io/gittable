import { SidebarSection } from "@renderer/components/ui-components/SidebarSection";
import "./SourceControl.css";
import type { Repository, RepositoryStatus } from "@sharedTypes/index";
import {
  Button,
  InputAndValidation,
  List,
  ListItem,
  MaterialSymbolButton,
} from "gittable-editor";
import { useModal } from "react-modal-hook";
import { ConfirmationModal } from "../../ui-components/ConfirmationModal";
import { DiffDescription } from "../editor-panel-group/EditorPanelGroup";
import { useState } from "react";

export type SourceControlProps = {
  repository: Repository;
  repositoryStatus: RepositoryStatus;
  onDiffSelect: (diff: DiffDescription) => void;
  onRepositoryStatusChange: () => void;
  onHistorySelect: () => void;
};

export function SourceControl({
  repository,
  repositoryStatus,
  onDiffSelect,
  onHistorySelect,
  onRepositoryStatusChange,
}: SourceControlProps): JSX.Element {
  const [showDiscardChangesModal, hideDiscardChangesModal] = useModal(() => (
    <ConfirmationModal
      title="Discarding changes"
      text={`Are you sure you want to discard all changes to ${repository.name} ?`}
      confirmButtonLabel="Discard changes"
      onConfirm={discardChanges}
      onCancel={hideDiscardChangesModal}
    />
  ));

  const [commitInProgress, setCommitInProgress] = useState<boolean>(false);
  const [commitMessage, setCommitMessage] = useState<string>("");

  const discardChanges = async (): Promise<void> => {
    const response = await window.api.discard_changes({
      repositoryId: repository.id,
    });
    if (response.status === "success") {
      hideDiscardChangesModal();
      onRepositoryStatusChange();
    } else {
      console.warn(`[SourceControl] Error discarding changes`);
    }
  };

  const commit = async (): Promise<void> => {
    setCommitInProgress(true);
    const response = await window.api.commit({
      repositoryId: repository.id,
      message: commitMessage,
    });
    if (response.status === "success") {
      onRepositoryStatusChange();
      setCommitMessage("");
    } else {
      console.warn(`[SourceControl] Error committing`);
    }
    setCommitInProgress(false);
  };

  const modifiedTables = repositoryStatus.tables.filter(
    (tableStatus) => tableStatus.modified === true,
  );

  const workingDirChanged: boolean = modifiedTables.length > 0;
  const canCommit = workingDirChanged && commitMessage !== "";

  return (
    <SidebarSection id="source-control" title="Source control">
      <div className="action-bar">
        <MaterialSymbolButton
          symbol="history"
          label="View history"
          onClick={onHistorySelect}
          tooltip
        />
        <MaterialSymbolButton
          symbol="undo"
          label="Discard all changes"
          onClick={showDiscardChangesModal}
          tooltip
          disabled={!workingDirChanged}
        />
      </div>
      <div className="working-dir-changes">
        <p className="current-changes-title">Current changes</p>
        <List label="Working dir changes">
          {workingDirChanged ? (
            modifiedTables.map((table) => (
              <ListItem
                key={table.id}
                text={table.name}
                materialSymbol="table"
                onClick={() =>
                  onDiffSelect({
                    table,
                    fromRef: "HEAD",
                    toRef: "WorkingDir",
                  })
                }
              ></ListItem>
            ))
          ) : (
            <div className="no-changes-text">
              You didn&apos;t make any changes to your tables
            </div>
          )}
        </List>
      </div>
      <div className="commit-section">
        <InputAndValidation
          value={commitMessage}
          onChange={setCommitMessage}
          placeholder="Describe your commit"
          maxLength={72}
        />
        <Button
          text="Commit"
          variant="outlined"
          onClick={commit}
          disabled={!canCommit}
          loading={commitInProgress}
        />
      </div>
    </SidebarSection>
  );
}
