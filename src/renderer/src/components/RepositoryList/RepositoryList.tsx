import { useState, useEffect } from "react";
import type { Repository } from "@sharedTypes/index";
import "./RepositoryList.css";

type RepositoryListProps = {
  onProjectSelect: (projectPath: string) => void;
};

export function RepositoryList({
  onProjectSelect,
}: RepositoryListProps): JSX.Element {
  const [repositories, setRepositories] = useState<Repository[]>([]);

  /** 
  @sideeffect At start load repository list
  */
  useEffect(() => {
    const fetchRepositories = async (): Promise<void> => {
      const response = await window.api.list_repositories();
      if (response.status === "success") {
        setRepositories(response.repositories);
      } else {
        console.error("[RepositoryList] Couldn't retrieve repository list");
      }
    };

    fetchRepositories();
  }, []);

  return (
    <ul className="repository-list">
      {repositories.map((repo) => (
        <li key={repo.id} onClick={() => onProjectSelect(repo.path)}>
          {repo.id}
        </li>
      ))}
    </ul>
  );
}
