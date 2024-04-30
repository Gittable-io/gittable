import { useSelector } from "react-redux";
import "./RemoteNotificationBar.css";
import { AppRootState } from "@renderer/store/store";
import { repoSelectors } from "@renderer/store/repoSlice";

export function RemoteNotificationBar(): JSX.Element | null {
  const currentVersion = useSelector(
    (state: AppRootState) => state.repo.currentVersion,
  )!;
  const isRemoteModified = useSelector((state: AppRootState) =>
    repoSelectors.isRemoteRepositoryModified(state),
  );

  const remoteStatus = useSelector(
    (state: AppRootState) => state.repo.remoteStatus,
  )!;

  const renderDraftVersionNotificationBar = (): JSX.Element | null => {
    if (remoteStatus.deletedDraft) return <p>The draft is deleted</p>;
    if (remoteStatus.newCommits) return <p>There are new commits</p>;
    return null;
  };

  const renderPublishedVersionNotificationBar = (): JSX.Element | null => {
    if (remoteStatus.newPublishedVersions)
      return <p>There are new published version</p>;
    if (remoteStatus.newDraft) return <p>There is a new draft</p>;
    return null;
  };

  if (!isRemoteModified) return null;
  if (
    currentVersion.type === "draft" &&
    remoteStatus.newCommits == undefined &&
    remoteStatus.deletedDraft == undefined
  )
    return null;
  if (
    currentVersion.type === "published" &&
    remoteStatus.newDraft == undefined &&
    remoteStatus.newPublishedVersions == undefined
  )
    return null;

  return (
    <div className="remote-notification-bar">
      {currentVersion.type === "draft"
        ? renderDraftVersionNotificationBar()
        : renderPublishedVersionNotificationBar()}
    </div>
  );
}
