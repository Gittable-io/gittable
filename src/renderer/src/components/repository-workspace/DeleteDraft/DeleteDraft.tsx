import { AppDispatch, AppRootState } from "@renderer/store/store";
import { Button } from "gittable-editor";
import { useDispatch, useSelector } from "react-redux";
import { repoActions, repoSelectors } from "@renderer/store/repoSlice";

export function DeleteDraft(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  const isDeleteDraftInProgress: boolean = useSelector(
    (state: AppRootState) =>
      state.repo.remoteActionSequence?.action.type === "DELETE_DRAFT",
  );

  const draftVersion = useSelector(
    (state: AppRootState) => repoSelectors.draftVersion(state)!,
  );

  return (
    <>
      <Button
        text="Delete draft"
        testId="Delete draft"
        variant="danger"
        onClick={() =>
          dispatch(
            repoActions.remoteAction({
              action: { type: "DELETE_DRAFT", draftVersion },
            }),
          )
        }
        loading={isDeleteDraftInProgress}
      />
    </>
  );
}
