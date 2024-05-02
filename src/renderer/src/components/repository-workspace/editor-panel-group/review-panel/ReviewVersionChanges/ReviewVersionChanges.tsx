import {
  DocumentChangeType,
  DraftVersion,
  VersionContentComparison,
} from "@sharedTypes/index";
import "./ReviewVersionChanges.css";
import { useEffect, useState } from "react";
import { Button, InputAndValidation, List, ListItem } from "gittable-editor";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, AppRootState } from "@renderer/store/store";
import { repoActions, repoSelectors } from "@renderer/store/repoSlice";

const getChangeAbbreviation = (change: DocumentChangeType): string => {
  switch (change) {
    case "added":
      return "(A)";
    case "deleted":
      return "(D)";
    case "modified":
      return "(M)";
    default:
      return "";
  }
};

export function ReviewVersionChanges(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  const [diff, setDiff] = useState<VersionContentComparison>([]);

  const repositoryId = useSelector(
    (state: AppRootState) => state.repo.repository!.id,
  );
  const currentVersion: DraftVersion = useSelector(
    (state: AppRootState) => state.repo.currentVersion! as DraftVersion,
  );
  const commits = useSelector(
    (state: AppRootState) => state.repo.currentVersionContent?.commits,
  );
  const isPublishDraftInProgress: boolean = useSelector(
    (state: AppRootState) =>
      state.repo.remoteActionSequence?.action.type === "PUBLISH_DRAFT",
  );
  const isWorkingDirModified = useSelector((state: AppRootState) =>
    repoSelectors.isWorkingDirModified(state),
  );
  const isDraftDeleted = useSelector(
    (state: AppRootState) => state.repo.remoteStatus?.deletedDraft != undefined,
  );

  const [publishName, setPublishName] = useState<string>(currentVersion.name);

  const canPublish =
    currentVersion.type === "draft" && !isWorkingDirModified && !isDraftDeleted;

  useEffect(() => {
    const fetchDiff = async (): Promise<void> => {
      if (currentVersion.type === "draft") {
        const diffResp = await window.api.compare_versions({
          repositoryId,
          fromVersion: currentVersion.basePublishedVersion,
          toVersion: currentVersion,
        });
        if (diffResp.status === "success") {
          setDiff(diffResp.diff);
        } else {
          console.error(`[ReviewVersionChanges] Error retrieving version diff`);
        }
      } else {
        setDiff([]);
      }
    };

    fetchDiff();
  }, [commits, currentVersion, repositoryId]);

  return (
    <div className="review-version-changes">
      <h2>
        Changes since version{" "}
        {currentVersion.basePublishedVersion === "INITIAL"
          ? "start"
          : currentVersion.basePublishedVersion.name}
      </h2>
      <div className="review-version-changes-actions">
        <div className="review-version-changes-publish">
          <InputAndValidation
            value={publishName}
            onChange={setPublishName}
            placeholder="Name your published version"
            maxLength={72}
          />
          <Button
            text="Publish"
            testId="publish-button"
            variant="outlined"
            disabled={!canPublish}
            onClick={() =>
              dispatch(
                repoActions.remoteAction({
                  action: {
                    type: "PUBLISH_DRAFT",
                    draftVersion: currentVersion,
                    publishingName: publishName,
                  },
                }),
              )
            }
            loading={isPublishDraftInProgress}
          />
        </div>
      </div>

      <List>
        {diff.map((tableDiff) => (
          <ListItem
            key={tableDiff.table.id}
            text={`${tableDiff.table.name} ${getChangeAbbreviation(tableDiff.change)}`}
            materialSymbol="table"
          ></ListItem>
        ))}
      </List>
    </div>
  );
}
