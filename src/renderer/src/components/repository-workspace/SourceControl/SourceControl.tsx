import { SidebarSection } from "@renderer/components/ui-components/SidebarSection";
import "./SourceControl.css";
import { useEffect, useState } from "react";
import { TableMetadata } from "@sharedTypes/index";
import { List, ListItem } from "gittable-editor";
import { useModal } from "react-modal-hook";
import { ConfirmationModal } from "../../ui-components/ConfirmationModal";

export type SourceControlProps = {
  repositoryId: string;
};

export function SourceControl({
  repositoryId,
}: SourceControlProps): JSX.Element {
  const [modifiedTables, setModifiedTables] = useState<TableMetadata[]>([]);
  const [showDiscardChangesModal, hideDiscardChangesModal] = useModal(() => (
    <ConfirmationModal
      title="Discarding changes"
      text={`Are you sure you want to discard all changes to ${repositoryId} ?`}
      confirmButtonLabel="Discard changes"
      onConfirm={handleDiscardChangesConfirm}
      onCancel={hideDiscardChangesModal}
    />
  ));

  const fetchChanges = async (): Promise<void> => {
    const response = await window.api.list_changes({ repositoryId });
    if (response.status === "success") {
      setModifiedTables(response.tableMetadataList);
      console.log("[SourceControl] Sucessfully discarded");
    } else {
      console.error("[SourceControl] Couldn't retrieve changes");
    }
  };

  const handleDiscardChangesConfirm = async (): Promise<void> => {
    discardChanges();
  };

  const discardChanges = async (): Promise<void> => {
    const response = await window.api.discard_changes({ repositoryId });
    if (response.status === "success") {
      hideDiscardChangesModal();
      fetchChanges();
    } else {
      console.warn(`[SourceControl] Error discarding changes`);
    }
  };

  useEffect(() => {
    fetchChanges();

    const intervalId = setInterval(fetchChanges, 5000);

    return () => clearInterval(intervalId);
  }, [repositoryId]);

  return (
    <SidebarSection id="source-control" title="Source control">
      <List>
        <ListItem
          text="Changes"
          secondaryAction={{
            materialSymbol: "undo",
            onClick: showDiscardChangesModal,
          }}
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
