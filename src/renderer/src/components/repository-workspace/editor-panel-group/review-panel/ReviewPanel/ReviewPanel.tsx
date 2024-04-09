import "./ReviewPanel.css";
import { ReviewWorkingDir } from "../ReviewWorkingDir";
import { ReviewCommits } from "../ReviewCommits";

export function ReviewPanel(): JSX.Element {
  return (
    <div className="review-panel">
      <ReviewWorkingDir />
      <ReviewCommits />
      <div className="review-version-changes">
        <h2>Changes from last published version</h2>
      </div>
    </div>
  );
}
