import { AppDispatch, AppRootState } from "@renderer/store/store";
import { Button } from "gittable-editor";
import { useDispatch, useSelector } from "react-redux";
import { CredentialsInputModal } from "../source-control/CredentialsInputModal";
import { repoActions, repoSelectors } from "@renderer/store/repoSlice";

export function DeleteDraft(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  const deleteDraftProgress = useSelector(
    (state: AppRootState) => state.repo.progress.deleteDraftProgress,
  );

  const draftVersion = useSelector(
    (state: AppRootState) => repoSelectors.draftVersion(state)!,
  );

  return (
    <>
      <Button
        text="Delete draft"
        variant="danger"
        onClick={() => dispatch(repoActions.deleteDraft({ draftVersion }))}
        loading={deleteDraftProgress !== "NONE"}
      />
      {(deleteDraftProgress === "REQUESTING_CREDENTIALS" ||
        deleteDraftProgress === "AUTH_ERROR") && (
        <CredentialsInputModal
          authError={deleteDraftProgress === "AUTH_ERROR"}
          onConfirm={(credentials) =>
            dispatch(repoActions.deleteDraft({ draftVersion, credentials }))
          }
          onCancel={() => dispatch(repoActions.cancelDeleteDraft())}
        />
      )}
    </>
  );
}
