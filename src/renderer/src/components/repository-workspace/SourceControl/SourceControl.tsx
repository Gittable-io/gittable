import { SidebarSection } from "@renderer/components/ui-components/SidebarSection";
import "./SourceControl.css";
import type { Repository, RepositoryStatus } from "@sharedTypes/index";
import { List, ListItem } from "gittable-editor";
import { useModal } from "react-modal-hook";
import { ConfirmationModal } from "../../ui-components/ConfirmationModal";

export type SourceControlProps = {
  repository: Repository;
  repositoryStatus: RepositoryStatus;
  onRepositoryChange: () => void;
};

export function SourceControl({
  repository,
  repositoryStatus,
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
                  materialSymbol: "undo",
                  onClick: showDiscardChangesModal,
                },
              }
            : {})}
        />
        <List subList>
          {modifiedTables.map((table) => (
            <ListItem
              key={table.id}
              text={table.name}
              materialSymbol="table"
            ></ListItem>
          ))}
        </List>
      </List>
    </SidebarSection>
  );
}
