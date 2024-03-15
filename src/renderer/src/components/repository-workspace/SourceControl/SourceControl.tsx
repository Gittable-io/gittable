import { SidebarSection } from "@renderer/components/ui-components/SidebarSection";
import "./SourceControl.css";
import type { Repository, RepositoryStatus } from "@sharedTypes/index";
import { List, ListItem } from "gittable-editor";
import { useModal } from "react-modal-hook";
import { ConfirmationModal } from "../../ui-components/ConfirmationModal";
import { DiffDescription } from "../editor-panel-group/EditorPanelGroup";

export type SourceControlProps = {
  repository: Repository;
  repositoryStatus: RepositoryStatus;
  onDiffSelect: (diff: DiffDescription) => void;
  onRepositoryChange: () => void;
};

export function SourceControl({
  repository,
  repositoryStatus,
  onDiffSelect,
  onRepositoryChange,
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
      onRepositoryChange();
    } else {
      console.warn(`[SourceControl] Error discarding changes`);
    }
  };

  const modifiedTables = repositoryStatus.tables.filter(
    (tableStatus) => tableStatus.modified === true,
  );

  return (
    <SidebarSection id="source-control" title="Source control">
      <List>
        <ListItem
          text="Changes"
          {...(modifiedTables.length > 0
            ? {
                secondaryAction: {
                  label: "Discard all changes",
                  materialSymbol: "undo",
                  onClick: showDiscardChangesModal,
                },
              }
            : {})}
        />
        <List subList label="Changed table list">
          {modifiedTables.map((table) => (
            <ListItem
              key={table.id}
              text={table.name}
              materialSymbol="table"
              onClick={() =>
                onDiffSelect({ table, from: "HEAD", to: "WorkingDir" })
              }
            ></ListItem>
          ))}
        </List>
      </List>
    </SidebarSection>
  );
}
