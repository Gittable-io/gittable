import { MaterialSymbolButton, Spinner } from "gittable-editor";
import { VersionSelector } from "../VersionSelector";
import "./VersionsSection.css";
import { NewDraftForm } from "../NewDraftForm";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, AppRootState } from "@renderer/store/store";
import { useState } from "react";
import { Version } from "@sharedTypes/index";
import { repoActions } from "@renderer/store/repoSlice";

export function VersionsSection(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  //#region Selectors
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

  const createDraft = async (draftName: string): Promise<void> => {
    setNewDraft(false);
    dispatch(repoActions.createAndSwitchToDraft(draftName));
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
              <NewDraftForm onNewDraft={createDraft} />
            </div>
          )}
        </>
      ) : (
        <Spinner />
      )}
    </div>
  );
}
