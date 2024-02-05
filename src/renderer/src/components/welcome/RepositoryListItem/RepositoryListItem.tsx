import { SidebarListItem } from "../../ui-components/SidebarListItem";
import type { Repository } from "@sharedTypes/index";
import { useModal } from "react-modal-hook";
import { ConfirmationModal } from "../../ui-components/ConfirmationModal";

export type RepositoryListItemProps = {
  repository: Repository;
  onRepositorySelect: () => void;
  onRepositoryDelete: () => void;
};

export function RepositoryListItem({
  repository,
  onRepositorySelect,
  onRepositoryDelete,
}: RepositoryListItemProps): JSX.Element {
  const [showDeleteRepositoryModal, hideDeleteRepositoryModal] = useModal(
    () => (
      <ConfirmationModal
        title="Deleting repository"
        text={`Are you sure you want to delete repository ${repository.name} ?`}
        onConfirm={handleDeleteRepositoryConfirm}
        onCancel={hideDeleteRepositoryModal}
      />
    ),
  );

  const deleteRepository = async (): Promise<void> => {
    const response = await window.api.delete_repository(repository.id);
    if (response.status === "success") {
      hideDeleteRepositoryModal();
    } else {
      console.warn(`[RepositoryListItem] Error deleting repository`);
    }
  };

  const handleDeleteRepositoryConfirm = async (): Promise<void> => {
    await deleteRepository();
    onRepositoryDelete();
  };

  return (
    <SidebarListItem
      text={repository.name}
      materialSymbol="database"
      onClick={onRepositorySelect}
      action={{
        materialSymbol: "delete",
        onClick: showDeleteRepositoryModal,
      }}
    ></SidebarListItem>
  );
}
