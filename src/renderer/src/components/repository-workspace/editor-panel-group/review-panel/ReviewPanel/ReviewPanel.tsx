import "./ReviewPanel.css";
import { ReviewWorkingDir } from "../ReviewWorkingDir";
import { ReviewCommits } from "../ReviewCommits";
import { ReviewVersionChanges } from "../ReviewVersionChanges";

export function ReviewPanel(): JSX.Element {
  return (
    <div className="review-panel">
      <ReviewWorkingDir />
      <ReviewCommits />
      <ReviewVersionChanges />
    </div>
  );
}
