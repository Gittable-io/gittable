import { MaterialSymbolButton, Spinner } from "gittable-editor";
import "./RepositoryWorkspaceSidebar2.css";
import { appActions } from "@renderer/store/appSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, AppRootState } from "@renderer/store/store";
import { VersionSelector } from "../VersionSelector";
import { RepositoryContent2 } from "../RepositoryContent2";
import { Version } from "@sharedTypes/index";
import { repoActions } from "@renderer/store/repoSlice";
import { useState } from "react";
import { NewDraftForm } from "../NewDraftForm";

export function RepositoryWorkspaceSidebar2(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  //#region Selectors
  const repository = useSelector(
    (state: AppRootState) => state.repo.repository!,
  )!;
  const completedLoadingVersions = useSelector(
    (state: AppRootState) => state.repo.loading.completedLoadingVersions,
  );

  const versions = useSelector((state: AppRootState) => state.repo.versions);
  const checkedOutVersion = useSelector(
    (state: AppRootState) => state.repo.checkedOutVersion!,
  );
  //#endregion

  const [newDraft, setNewDraft] = useState<boolean>(false);

  const checkOutVersion = async (version: Version): Promise<void> => {
    setNewDraft(false);

    dispatch(repoActions.startCheckout(version));
    const response = await window.api.switch_version({
      repositoryId: repository.id,
      version,
    });

    if (response.status === "success") {
      dispatch(repoActions.completeCheckout(response.content));
    } else {
      console.error(`[RepositoryWorkspaceSidebar] Error switching version`);
    }
  };

  const canCreateDraft = checkedOutVersion.current;

  return (
    <div className="repository-workspace-sidebar2">
      <div className="toolbar">
        <MaterialSymbolButton
          symbol="close"
          onClick={() => dispatch(appActions.closeRepository())}
        />
      </div>
      <div className="title">
        <h2>{repository.name}</h2>
      </div>
      <div className="versions-section">
        {completedLoadingVersions ? (
          <>
            <div className="version-list-and-create">
              <VersionSelector
                versions={versions}
                selectedVersion={checkedOutVersion}
                onVersionChange={checkOutVersion}
              />
              {!newDraft ? (
                <MaterialSymbolButton
                  symbol="add_box"
                  label="Create draft version"
                  tooltip
                  disabled={!canCreateDraft}
                  onClick={() => {
                    setNewDraft((s) => !s);
                  }}
                />
              ) : (
                <MaterialSymbolButton
                  symbol="cancel"
                  label="Cancel creating draft"
                  tooltip
                  onClick={() => {
                    setNewDraft((s) => !s);
                  }}
                />
              )}
            </div>
            {newDraft && (
              <div className="new-draft-section">
                <NewDraftForm />
              </div>
            )}
          </>
        ) : (
          <Spinner />
        )}
      </div>
      <div className="content">
        <RepositoryContent2 />
      </div>
    </div>
  );
}
