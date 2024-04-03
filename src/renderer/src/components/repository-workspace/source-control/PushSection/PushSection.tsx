import { Button } from "gittable-editor";
import "./PushSection.css";
import { useState } from "react";
import { Repository, RepositoryStatus } from "@sharedTypes/index";
import { CredentialsInputModal } from "../CredentialsInputModal";
import { useModal } from "react-modal-hook";

export type PushSectionProps = {
  repository: Repository;
  repositoryStatus: RepositoryStatus;
  onRepositoryStatusChange: () => void;
};

export function PushSection({
  repository,
  repositoryStatus,
  onRepositoryStatusChange,
}: PushSectionProps): JSX.Element {
  const [showPushCredentialsModal, hidePushCredentialsModal] = useModal(() => (
    <CredentialsInputModal />
  ));

  const [pushInProgress, setPushInProgress] = useState<boolean>(false);

  const push = async (): Promise<void> => {
    setPushInProgress(true);
    const response = await window.api.push({
      repositoryId: repository.id,
    });
    if (response.status === "success") {
      onRepositoryStatusChange();
      setPushInProgress(false);
    } else {
      if (response.type === "No credentials provided") {
        showPushCredentialsModal();
      } else {
        console.error(`[SourceControl] Error pushing to remote`);
      }
    }
  };

  const canPush = repositoryStatus.currentBranch.isAheadOfRemote;

  return (
    <div className="push-section">
      {canPush ? (
        <Button
          text="Share"
          variant="outlined"
          onClick={push}
          disabled={!canPush}
          loading={pushInProgress}
        />
      ) : (
        <p className="no-action">You have no changes to share with your team</p>
      )}
    </div>
  );
}
