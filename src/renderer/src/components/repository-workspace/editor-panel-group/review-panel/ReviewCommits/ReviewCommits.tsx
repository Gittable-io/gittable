import { useSelector } from "react-redux";
import "./ReviewCommits.css";
import { AppRootState } from "@renderer/store/store";

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
  const commits = useSelector(
    (state: AppRootState) => state.repo.currentVersionContent!.commits,
  );

  return (
    <div className="review-commits">
      <h2>Commits included in this version</h2>
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
              <td>{/* TODO: Mark which commits were not pushed */}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
