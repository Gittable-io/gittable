import "./ReviewPanel.css";
import { ReviewWorkingDir } from "../ReviewWorkingDir";
import { ReviewCommits } from "../ReviewCommits";
import { ReviewVersionChanges } from "../ReviewVersionChanges";
import { useSelector } from "react-redux";
import { AppRootState } from "@renderer/store/store";
import { repoSelectors } from "@renderer/store/repoSlice";

export function ReviewPanel(): JSX.Element {
  const isWorkspaceDataCompletelyLoaded: boolean = useSelector(
    (state: AppRootState) =>
      repoSelectors.isWorkspaceDataCompletelyLoaded(state),
  );

  return (
    <div className="review-panel">
      {isWorkspaceDataCompletelyLoaded && (
        <>
          <ReviewWorkingDir />
          <ReviewCommits />
          <ReviewVersionChanges />
        </>
      )}
    </div>
  );
}
