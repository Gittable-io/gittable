import { SidebarSection } from "@renderer/components/ui-components/SidebarSection";
import "./SourceControl.css";
import type { Repository, RepositoryStatus } from "@sharedTypes/index";
import { Button, List, ListItem, MaterialSymbolButton } from "gittable-editor";
import { useModal } from "react-modal-hook";
import { ConfirmationModal } from "../../ui-components/ConfirmationModal";
import { DiffDescription } from "../editor-panel-group/EditorPanelGroup";
import { useState } from "react";

export type SourceControlProps = {
  repository: Repository;
  repositoryStatus: RepositoryStatus;
  onDiffSelect: (diff: DiffDescription) => void;
  onRepositoryStatusChange: () => void;
};

export function SourceControl({
  repository,
  repositoryStatus,
  onDiffSelect,
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
    const response = await window.api.commit({ repositoryId: repository.id });
    if (response.status === "success") {
      onRepositoryStatusChange();
    } else {
      console.warn(`[SourceControl] Error committing`);
    }
    setCommitInProgress(false);
  };

  const modifiedTables = repositoryStatus.tables.filter(
    (tableStatus) => tableStatus.modified === true,
  );

  const workingDirChanged: boolean = modifiedTables.length > 0;

  return (
    <SidebarSection id="source-control" title="Source control">
      <div className="action-bar">
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
        <Button
          text="Commit"
          variant="outlined"
          onClick={commit}
          disabled={!workingDirChanged}
          loading={commitInProgress}
        />
      </div>
    </SidebarSection>
  );
}
