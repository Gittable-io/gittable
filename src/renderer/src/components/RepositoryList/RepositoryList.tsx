import { useState, useEffect } from "react";
import type { Repository } from "@sharedTypes/index";
import { SidebarList } from "../ui-components/SidebarList";
import { RepositoryListItem } from "../RepositoryListItem";

type RepositoryListProps = {
  onRepositorySelect: (repository: Repository) => void;
};

export function RepositoryList({
  onRepositorySelect,
}: RepositoryListProps): JSX.Element {
  const [repositories, setRepositories] = useState<Repository[]>([]);

  const fetchRepositories = async (): Promise<void> => {
    const response = await window.api.list_repositories();
    if (response.status === "success") {
      setRepositories(response.repositories);
    } else {
      console.error("[RepositoryList] Couldn't retrieve repository list");
    }
  };

  /** 
  @sideeffect At start load repository list
  */
  useEffect(() => {
    fetchRepositories();
  }, []);

  return (
    <SidebarList title="Repositories">
      {repositories.map((repo) => (
        <RepositoryListItem
          key={repo.id}
          repository={repo}
          onRepositorySelect={() => onRepositorySelect(repo)}
          onRepositoryDelete={fetchRepositories}
        />
      ))}
    </SidebarList>
  );
}
