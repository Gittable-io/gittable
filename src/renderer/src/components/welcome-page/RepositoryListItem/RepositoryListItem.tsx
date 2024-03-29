import type { Repository } from "@sharedTypes/index";
import { useModal } from "react-modal-hook";
import { ConfirmationModal } from "../../ui-components/ConfirmationModal";
import { ListItem } from "gittable-editor";

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
        confirmButtonLabel="Delete repository"
        onConfirm={handleDeleteRepositoryConfirm}
        onCancel={hideDeleteRepositoryModal}
      />
    ),
  );

  const deleteRepository = async (): Promise<void> => {
    const response = await window.api.delete_repository({
      repositoryId: repository.id,
    });
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
    <ListItem
      text={repository.name}
      materialSymbol="database"
      onClick={onRepositorySelect}
      secondaryAction={{
        materialSymbol: "delete",
        label: "Delete repository",
        onClick: showDeleteRepositoryModal,
      }}
    />
  );
}
