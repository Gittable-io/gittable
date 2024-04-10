import { Button } from "gittable-editor";
import "./PushSection.css";
import { useState } from "react";
import {
  Repository,
  RepositoryCredentials,
  RepositoryStatus,
} from "@sharedTypes/index";
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
  const [pushInProgress, setPushInProgress] = useState<boolean>(false);
  const [pushError, setPushError] = useState<string | null>(null);

  const [showPushCredentialsModal, hidePushCredentialsModal] = useModal(
    () => (
      <CredentialsInputModal
        authError={pushError != null}
        onConfirm={(credentials) => push(credentials)}
        onCancel={cancelPush}
      />
    ),
    [pushError, cancelPush, push],
  );

  async function cancelPush(): Promise<void> {
    setPushInProgress(false);
    hidePushCredentialsModal();
    setPushError(null);
  }

  const requestPush = async (
    credentials?: RepositoryCredentials,
  ): Promise<ReturnType<typeof window.api.push>> => {
    if (credentials)
      return window.api.push({
        repositoryId: repository.id,
        credentials,
      });
    else {
      return window.api.push({
        repositoryId: repository.id,
      });
    }
  };

  async function push(credentials?: RepositoryCredentials): Promise<void> {
    console.debug(
      `[PushSection/push] Pushing to repository ${credentials ? "with" : "without"} credentials`,
    );
    hidePushCredentialsModal();
    setPushInProgress(true);
    const response = await requestPush(credentials);
    if (response.status === "success") {
      console.debug(`[PushSection/push] Push was successfull`);

      onRepositoryStatusChange();
      setPushInProgress(false);
    } else {
      console.debug(`[PushSection/push] Push error: ${response.type}`);

      if (response.type === "No credentials provided") {
        setPushError(null);
        showPushCredentialsModal();
      } else if (
        response.type === "Error authenticating with provided credentials"
      ) {
        setPushError(response.type);
        showPushCredentialsModal();
      } else {
        console.error(`[SourceControl] Unhandled Push error: ${response.type}`);
      }
    }
  }

  const canPush = repositoryStatus.currentBranch.isAheadOfRemote;

  return (
    <div className="push-section">
      {canPush ? (
        <Button
          text="Share"
          variant="outlined"
          onClick={() => push()}
          disabled={!canPush}
          loading={pushInProgress}
        />
      ) : (
        <p className="no-action">You have no changes to share with your team</p>
      )}
    </div>
  );
}
