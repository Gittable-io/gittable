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

  const versions = useSelector((state: AppRootState) => state.repo.versions);
  const checkedOutVersion = useSelector(
    (state: AppRootState) => state.repo.currentVersion,
  );
  //#endregion

  const [newDraft, setNewDraft] = useState<boolean>(false);

  const switchVersion = async (version: Version): Promise<void> => {
    setNewDraft(false);

    dispatch(repoActions.switchVersion(version));
  };

  const hasDraft = (versions: Version[]): boolean => {
    return versions.some((v) => v.type === "draft");
  };

  const canCreateDraft =
    checkedOutVersion &&
    versions &&
    !hasDraft(versions) &&
    checkedOutVersion.type === "published" &&
    checkedOutVersion.newest;

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
        {versions && checkedOutVersion ? (
          <>
            <div className="version-list-and-create">
              <VersionSelector
                versions={versions}
                selectedVersion={checkedOutVersion}
                onVersionChange={switchVersion}
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
