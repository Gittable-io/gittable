import { DraftVersion, VersionContentComparison } from "@sharedTypes/index";
import { useEffect, useState } from "react";
import { List, ListItem } from "gittable-editor";
import { useSelector } from "react-redux";
import { AppRootState } from "@renderer/store/store";

export function ReviewVersionChanges(): JSX.Element {
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

  useEffect(() => {
    const fetchDiff = async (): Promise<void> => {
      if (currentVersion.type === "draft") {
        const diffResp = await window.api.compare_versions({
          repositoryId,
          fromVersion: currentVersion,
          toVersion: currentVersion.basePublishedVersion,
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
      <List>
        {diff.map((tableDiff) => (
          <ListItem
            key={tableDiff.table.id}
            text={tableDiff.table.name}
            materialSymbol="table"
          ></ListItem>
        ))}
      </List>
    </div>
  );
}
