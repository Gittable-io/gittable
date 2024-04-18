import { MaterialSymbolButton, Spinner } from "gittable-editor";
import { VersionSelector } from "../VersionSelector";
import "./VersionsSection.css";
import { NewDraftForm } from "../NewDraftForm";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, AppRootState } from "@renderer/store/store";
import { useState } from "react";
import { Version } from "@sharedTypes/index";
import { repoActions, repoSelectors } from "@renderer/store/repoSlice";
import { ConfirmationModal } from "@renderer/components/ui-components/ConfirmationModal";
import { useModal } from "react-modal-hook";

export function VersionsSection(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  //#region Selectors & State
  const versions = useSelector((state: AppRootState) => state.repo.versions);
  const currentVersion = useSelector(
    (state: AppRootState) => state.repo.currentVersion,
  );
  const isWorkingDirModified = useSelector((state: AppRootState) =>
    repoSelectors.isWorkingDirModified(state),
  );

  const waitingForNewDraftName = useSelector(
    (state: AppRootState) => state.repo.waitingForNewDraftName,
  );

  const [pendingVersion, setPendingVersion] = useState<Version | null>(null);

  const [showSwitchWarningModal, hideSwitchWarningModal] = useModal(
    () => (
      <ConfirmationModal
        title={`Switching to version ${pendingVersion?.name}`}
        text={`If you switch to a published version, you will lose your uncommitted changes. Are you sure you want to switch?`}
        confirmButtonLabel="Switch versions"
        onConfirm={() => {
          if (pendingVersion !== null) {
            switchVersion(pendingVersion);
            setPendingVersion(null); // Reset the pending version after switching
          }
          hideSwitchWarningModal();
        }}
        onCancel={() => {
          hideSwitchWarningModal();
          setPendingVersion(null);
        }}
      />
    ),
    [pendingVersion],
  );

  //#endregion

  const confirmSwitchVersion = async (version: Version): Promise<void> => {
    if (isWorkingDirModified) {
      setPendingVersion(version); // Set the version the user intends to switch to
      showSwitchWarningModal();
    } else {
      switchVersion(version);
    }
  };

  const switchVersion = async (version: Version): Promise<void> => {
    dispatch(repoActions.switchVersion(version));
  };

  const hasDraft = (versions: Version[]): boolean => {
    return versions.some((v) => v.type === "draft");
  };

  const canCreateDraft =
    currentVersion &&
    versions &&
    !hasDraft(versions) &&
    currentVersion.type === "published" &&
    currentVersion.newest;

  return (
    <div className="versions-section">
      {versions && currentVersion ? (
        <>
          <div className="version-list-and-create">
            <VersionSelector
              versions={versions}
              selectedVersion={currentVersion}
              onVersionChange={confirmSwitchVersion}
            />
            {!waitingForNewDraftName ? (
              <MaterialSymbolButton
                symbol="add_box"
                label="Create draft version"
                tooltip
                disabled={!canCreateDraft}
                onClick={() => {
                  dispatch(repoActions.setWaitingForNewDraftName(true));
                }}
              />
            ) : (
              <MaterialSymbolButton
                symbol="cancel"
                label="Cancel creating draft"
                tooltip
                onClick={() => {
                  dispatch(repoActions.setWaitingForNewDraftName(false));
                }}
              />
            )}
          </div>
          {waitingForNewDraftName && (
            <div className="new-draft-section">
              <NewDraftForm />
            </div>
          )}
        </>
      ) : (
        <Spinner />
      )}
    </div>
  );
}
