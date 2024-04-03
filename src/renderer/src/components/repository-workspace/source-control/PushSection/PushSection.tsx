import { Button } from "gittable-editor";
import "./PushSection.css";
import { useCallback, useEffect, useState } from "react";
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
  const [waitingForCredentials, _setWaitingForCredentials] =
    useState<boolean>(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const [providedCredentials, setProvidedCredentials] =
    useState<RepositoryCredentials | null>(null);

  const [showPushCredentialsModal, hidePushCredentialsModal] = useModal(
    () => (
      <CredentialsInputModal
        errorMessage={pushError}
        onConfirm={(credentials) => {
          setProvidedCredentials(credentials);
          setWaitingForCredentials(false);
        }}
        onCancel={cancelPush}
      />
    ),
    [pushError, setProvidedCredentials, cancelPush],
  );

  const setWaitingForCredentials = useCallback(
    (waitForUser: boolean): void => {
      _setWaitingForCredentials(waitForUser);
      if (waitForUser) {
        showPushCredentialsModal();
      } else {
        hidePushCredentialsModal();
      }
    },
    [hidePushCredentialsModal, showPushCredentialsModal],
  );

  async function cancelPush(): Promise<void> {
    setWaitingForCredentials(false);
    setPushInProgress(false);
    setPushError(null);
    setProvidedCredentials(null);
  }

  /**
   * @side-effect: if push is in progress and we're not waiting for credentials => push
   */
  useEffect(() => {
    console.debug(`[PushSection/useEffect] Entering push useEffect`);
    const requestPush = async (): Promise<
      ReturnType<typeof window.api.push>
    > => {
      if (providedCredentials)
        return window.api.push({
          repositoryId: repository.id,
          credentials: providedCredentials,
        });
      else {
        return window.api.push({
          repositoryId: repository.id,
        });
      }
    };

    const push = async (): Promise<void> => {
      const response = await requestPush();
      if (response.status === "success") {
        onRepositoryStatusChange();
        setPushInProgress(false);
      } else {
        if (
          response.type === "No credentials provided" ||
          response.type === "Error authenticating with provided credentials"
        ) {
          setPushError(response.message);
          setWaitingForCredentials(true);
        } else {
          console.error(`[SourceControl] Error pushing to remote`);
        }
      }
    };

    if (pushInProgress && !waitingForCredentials) {
      console.debug(`[PushSection/useEffect] Pushing`);
      push();
    }
  }, [
    onRepositoryStatusChange,
    providedCredentials,
    pushInProgress,
    repository.id,
    setWaitingForCredentials,
    waitingForCredentials,
  ]);

  const canPush = repositoryStatus.currentBranch.isAheadOfRemote;

  return (
    <div className="push-section">
      {canPush ? (
        <Button
          text="Share"
          variant="outlined"
          onClick={() => {
            setPushInProgress(true);
          }}
          disabled={!canPush}
          loading={pushInProgress}
        />
      ) : (
        <p className="no-action">You have no changes to share with your team</p>
      )}
    </div>
  );
}
