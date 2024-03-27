import { SidebarSection } from "@renderer/components/ui-components/SidebarSection";
import "./SourceControl.css";
import type { Repository, RepositoryStatus } from "@sharedTypes/index";
import { List, ListItem, MaterialSymbolButton } from "gittable-editor";
import { useModal } from "react-modal-hook";
import { ConfirmationModal } from "../../ui-components/ConfirmationModal";
import { DiffDescription } from "../editor-panel-group/EditorPanelGroup";

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
      onConfirm={handleDiscardChangesConfirm}
      onCancel={hideDiscardChangesModal}
    />
  ));

  const handleDiscardChangesConfirm = async (): Promise<void> => {
    discardChanges();
  };

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

  const modifiedTables = repositoryStatus.tables.filter(
    (tableStatus) => tableStatus.modified === true,
  );

  return (
    <SidebarSection id="source-control" title="Source control">
      <div className="action-bar">
        <MaterialSymbolButton
          symbol="undo"
          label="Discard all changes"
          onClick={showDiscardChangesModal}
          tooltip
          disabled={modifiedTables.length === 0}
        />
      </div>
      <div className="working-dir-changes">
        <p className="current-changes-title">Current changes</p>
        <List label="Working dir changes">
          {modifiedTables.length > 0 ? (
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
    </SidebarSection>
  );
}
