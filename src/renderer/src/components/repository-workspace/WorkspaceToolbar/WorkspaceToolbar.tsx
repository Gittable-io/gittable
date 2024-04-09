import { useDispatch, useSelector } from "react-redux";
import "./WorkspaceToolbar.css";
import { AppDispatch, AppRootState } from "@renderer/store/store";
import { Button, IconAndText } from "gittable-editor";
import { getVersionMaterialSymbol } from "@renderer/utils/utils";
import { repoActions } from "@renderer/store/repoSlice";
import { DraftVersion } from "@sharedTypes/index";
import { useModal } from "react-modal-hook";
import { ConfirmationModal } from "@renderer/components/ui-components/ConfirmationModal";

export function WorkspaceToolbar(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  const currentVersion = useSelector(
    (state: AppRootState) => state.repo.currentVersion,
  )!;

  const versions = useSelector((state: AppRootState) => state.repo.versions)!;
  const deleteDraftInProgress = useSelector(
    (state: AppRootState) => state.repo.progress.deleteDraftInProgress,
  )!;

  const draftVersion: DraftVersion | undefined = versions?.find(
    (v) => v.type === "draft",
  ) as DraftVersion | undefined;

  const [showDeleteDraftModal, hideDeleteDraftModal] = useModal(
    () => (
      <ConfirmationModal
        title="Deleting draft"
        text={`Are you sure you want to delete draft ${draftVersion?.name}?`}
        confirmButtonLabel="Delete draft"
        onConfirm={() => deleteDraft(draftVersion!)}
        onCancel={hideDeleteDraftModal}
      />
    ),
    [draftVersion],
  );

  const deleteDraft = (version: DraftVersion): void => {
    hideDeleteDraftModal();
    dispatch(repoActions.deleteDraft(version));
  };

  return (
    <div className="workspace-toolbar">
      {currentVersion && (
        <>
          <IconAndText
            materialSymbol={getVersionMaterialSymbol(currentVersion)}
            text={`${currentVersion.type === "published" ? (currentVersion.newest ? "Viewing latest published" : "Viewing published") : "Editing draft"} version: ${currentVersion.name}`}
          />
          {currentVersion.type === "draft" && (
            <Button
              text="Review version"
              variant="outlined"
              onClick={() =>
                dispatch(
                  repoActions.openPanel({ type: "review_current_version" }),
                )
              }
            />
          )}
          {currentVersion.type === "published" && draftVersion && (
            <Button
              text="Delete draft"
              variant="danger"
              onClick={showDeleteDraftModal}
              loading={deleteDraftInProgress}
            />
          )}
        </>
      )}
    </div>
  );
}
