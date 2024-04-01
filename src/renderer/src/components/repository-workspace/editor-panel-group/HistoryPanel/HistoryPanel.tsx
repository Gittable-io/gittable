import { ReadCommitResult } from "isomorphic-git";
import { useEffect, useState } from "react";

export type HistoryPanelProps = {
  repositoryId: string;
};

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
      {history.map((commit) => (
        <div key={commit.oid}>{`${commit.oid} : ${commit.commit.message}`}</div>
      ))}
    </div>
  );
}
