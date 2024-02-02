import { useState, useEffect } from "react";
import type { Repository } from "@sharedTypes/index";
import "./RepositoryList.css";

type RepositoryListProps = {
  onRepositorySelect: (repository: Repository) => void;
};

export function RepositoryList({
  onRepositorySelect,
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
        <li key={repo.id} onClick={() => onRepositorySelect(repo)}>
          {repo.name}
        </li>
      ))}
    </ul>
  );
}
