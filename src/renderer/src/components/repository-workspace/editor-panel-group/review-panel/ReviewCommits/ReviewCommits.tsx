import { useDispatch, useSelector } from "react-redux";
import "./ReviewCommits.css";
import { AppDispatch, AppRootState } from "@renderer/store/store";
import { Button, MaterialSymbol } from "gittable-editor";
import { repoActions } from "@renderer/store/repoSlice";

function formatTimestamp(timestamp: number, timezoneOffset: number): string {
  // Convert timestamp from seconds to milliseconds
  const dateInUTC = new Date(timestamp * 1000);

  // Calculate the local time considering the timezoneOffset
  // Note: timezoneOffset from the variable is in minutes, and JavaScript's getTimezoneOffset() returns the difference
  // in minutes too, but with an opposite sign. So, we add them to adjust to the user's timezone.
  const userTimezoneOffset = dateInUTC.getTimezoneOffset();
  const localDate = new Date(
    dateInUTC.getTime() - timezoneOffset * 60000 + userTimezoneOffset * 60000,
  );

  // Format the date
  // Added "as const" to fix a typescript error (see https://stackoverflow.com/a/73569941/471461)
  const options = {
    day: "numeric" as const,
    month: "short" as const,
    year: "numeric" as const,
    hour: "2-digit" as const,
    minute: "2-digit" as const,
    hour12: false,
  };
  return localDate.toLocaleDateString("en-GB", options).replace(",", "");
}

export function ReviewCommits(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  const commits = useSelector(
    (state: AppRootState) => state.repo.currentVersionContent!.commits,
  );
  const isPushCommitInProgress: boolean = useSelector(
    (state: AppRootState) =>
      state.repo.remoteActionSequence?.action.type === "PUSH_COMMITS",
  );

  const unpushedCommits = commits.some((c) => !c.inRemote);

  return (
    <div className="review-commits">
      <h2>Commits included in this version</h2>
      <Button
        text="Share your commits"
        variant="outlined"
        disabled={!unpushedCommits}
        onClick={() =>
          dispatch(
            repoActions.remoteAction({
              action: { type: "PUSH_COMMITS" },
            }),
          )
        }
        loading={isPushCommitInProgress}
      />
      <table>
        <thead>
          <tr>
            <th scope="col">Description</th>
            <th scope="col">Date</th>
            <th scope="col">Author</th>
            <th scope="col">Shared</th>
          </tr>
        </thead>
        <tbody>
          {commits.map((c) => (
            <tr key={c.oid}>
              <td>{c.message}</td>
              <td>
                {formatTimestamp(c.author.timestamp, c.author.timezoneOffset)}
              </td>
              <td>{`${c.author.name} (${c.author.email})`}</td>
              <td>{!c.inRemote && <MaterialSymbol symbol="cloud_upload" />}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
