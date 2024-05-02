import { useDispatch, useSelector } from "react-redux";
import "./WorkspaceToolbar.css";
import { AppDispatch, AppRootState } from "@renderer/store/store";
import { Button, IconAndText } from "gittable-editor";
import { getVersionMaterialSymbol } from "@renderer/utils/utils";
import { repoActions, repoSelectors } from "@renderer/store/repoSlice";
import { DeleteDraft } from "../DeleteDraft";

export function WorkspaceToolbar(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  const currentVersion = useSelector(
    (state: AppRootState) => state.repo.currentVersion,
  )!;
  const draftVersion = useSelector((state: AppRootState) =>
    repoSelectors.draftVersion(state),
  );

  const isFetchRemoteRepositoryChangesInProgress: boolean = useSelector(
    (state: AppRootState) =>
      state.repo.remoteActionSequence?.action.type ===
      "FETCH_REMOTE_REPOSITORY_CHANGES",
  );

  return (
    <div className="workspace-toolbar">
      {currentVersion && (
        <>
          <div className="workspace-info">
            <IconAndText
              materialSymbol={getVersionMaterialSymbol(currentVersion)}
              text={`${currentVersion.type === "published" ? (currentVersion.newest ? "Viewing latest published" : "Viewing published") : "Editing draft"} version: ${currentVersion.name}`}
            />
          </div>
          <div className="workspace-toolbar-actions">
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
              <DeleteDraft />
            )}
            <Button
              text="Get Latest Updates"
              variant="outlined"
              onClick={() =>
                dispatch(
                  repoActions.remoteAction({
                    action: {
                      type: "FETCH_REMOTE_REPOSITORY_CHANGES",
                    },
                  }),
                )
              }
              loading={isFetchRemoteRepositoryChangesInProgress}
            />
          </div>
        </>
      )}
    </div>
  );
}
