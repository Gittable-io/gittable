import { useState, useEffect } from "react";
import type { Repository } from "@sharedTypes/index";
import { SidebarList } from "../SidebarList";
import { SidebarListItem } from "../SidebarListItem";

type RepositoryListProps = {
  onRepositorySelect: (repository: Repository) => void;
};

export function RepositoryList({
  onRepositorySelect,
}: RepositoryListProps): JSX.Element {
  const [repositories, setRepositories] = useState<Repository[]>([]);

  const handleDeleteRepository = async (
    repositoryId: string,
  ): Promise<void> => {
    await window.api.delete_repository(repositoryId);
  };

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
    <SidebarList title="Repositories">
      {repositories.map((repo) => (
        <SidebarListItem
          key={repo.id}
          text={repo.name}
          onClick={() => onRepositorySelect(repo)}
          action={{
            materialIcon: "delete",
            onClick: () => handleDeleteRepository(repo.id),
          }}
        ></SidebarListItem>
      ))}
    </SidebarList>
  );
}
