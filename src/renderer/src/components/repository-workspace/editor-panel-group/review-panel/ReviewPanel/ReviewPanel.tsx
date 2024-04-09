import "./ReviewPanel.css";
import { ReviewWorkingDir } from "../ReviewWorkingDir";

export function ReviewPanel(): JSX.Element {
  return (
    <div className="review-panel">
      <ReviewWorkingDir />
      <div className="review-commits">
        <h2>Commits included in this version</h2>
      </div>
      <div className="review-version-changes">
        <h2>Changes from last published version</h2>
      </div>
    </div>
  );
}
