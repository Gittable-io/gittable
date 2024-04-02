import "./HistoryPanel.css";
import { ReadCommitResult } from "isomorphic-git";
import { useEffect, useState } from "react";

export type HistoryPanelProps = {
  repositoryId: string;
};

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

export function HistoryPanel({ repositoryId }: HistoryPanelProps): JSX.Element {
  const [history, setHistory] = useState<ReadCommitResult[]>([]);

  useEffect(() => {
    const fetchHistory = async (): Promise<void> => {
      const response = await window.api.get_history({ repositoryId });
      setHistory(response.history);
    };

    fetchHistory();
  }, [repositoryId]);

  return (
    <div className="history-panel">
      <table>
        <thead>
          <tr>
            <th scope="col">Description</th>
            <th scope="col">Date</th>
            <th scope="col">Author</th>
          </tr>
        </thead>
        <tbody>
          {history.map((c) => (
            <tr key={c.oid}>
              <td>{c.commit.message}</td>
              {/*
              // ! Read https://stackoverflow.com/a/11857467/471461 for author.timestamp vs committer.timestamp
              */}
              <td>
                {formatTimestamp(
                  c.commit.author.timestamp,
                  c.commit.author.timezoneOffset,
                )}
              </td>
              <td>{`${c.commit.author.name} (${c.commit.author.email})`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
