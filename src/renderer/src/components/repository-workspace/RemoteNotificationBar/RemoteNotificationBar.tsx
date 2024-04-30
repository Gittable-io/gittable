import { useDispatch, useSelector } from "react-redux";
import "./RemoteNotificationBar.css";
import { AppDispatch, AppRootState } from "@renderer/store/store";
import { repoActions, repoSelectors } from "@renderer/store/repoSlice";
import { Spinner } from "gittable-editor";

type RemoteNotificationType =
  | "NEW_DRAFT"
  | "NEW_COMMITS"
  | "DELETED_DRAFT"
  | "NEW_PUBLISHED_VERSION";

export function RemoteNotificationBar(): JSX.Element | null {
  const dispatch = useDispatch<AppDispatch>();

  const currentVersion = useSelector(
    (state: AppRootState) => state.repo.currentVersion,
  )!;
  const isRemoteModified = useSelector((state: AppRootState) =>
    repoSelectors.isRemoteRepositoryModified(state),
  );

  const remoteStatus = useSelector(
    (state: AppRootState) => state.repo.remoteStatus,
  )!;

  const isPullInProgress: boolean = useSelector(
    (state: AppRootState) =>
      state.repo.remoteActionSequence?.action.type === "PULL_NEW_DRAFT",
  );

  const getNotificationType = (): RemoteNotificationType | null => {
    if (!isRemoteModified) return null;

    if (currentVersion.type === "draft") {
      if (remoteStatus.newCommits) return "NEW_COMMITS";
      else if (remoteStatus.deletedDraft) return "DELETED_DRAFT";
      else return null;
    } else {
      if (remoteStatus.newPublishedVersions) return "NEW_PUBLISHED_VERSION";
      else if (remoteStatus.newDraft) return "NEW_DRAFT";
      else return null;
    }
  };

  const notificationType = getNotificationType();

  const renderNotificationBar = (
    notifType: RemoteNotificationType,
  ): JSX.Element | null => {
    if (isPullInProgress) return <Spinner inline />;

    switch (notifType) {
      case "NEW_COMMITS":
        return <p>There are new commits</p>;
      case "DELETED_DRAFT":
        return <p>The draft is deleted</p>;
      case "NEW_DRAFT":
        return <p>There is a new draft. Click to retrieve it.</p>;
      case "NEW_PUBLISHED_VERSION":
        return <p>There are new published version</p>;
    }
  };

  const handleClick = (notifType: RemoteNotificationType): void => {
    switch (notifType) {
      case "NEW_DRAFT": {
        dispatch(
          repoActions.remoteAction({
            action: {
              type: "PULL_NEW_DRAFT",
              draftVersion: remoteStatus.newDraft!.draftVersion,
            },
          }),
        );
      }
    }
  };

  return notificationType ? (
    <div
      className="remote-notification-bar"
      onClick={() => handleClick(notificationType)}
    >
      {renderNotificationBar(notificationType)}
    </div>
  ) : null;
}
