import { useState, useEffect } from "react";
import type { Repository } from "@sharedTypes/index";
import { RepositoryListItem } from "../RepositoryListItem";
import { List } from "gittable-editor";
import "./RepositoryList.css";
import { SidebarSection } from "@renderer/components/ui-components/SidebarSection";

export function RepositoryList(): JSX.Element {
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
    <SidebarSection id="repository-list" title="Repositories">
      <List>
        {repositories.map((repo) => (
          <RepositoryListItem
            key={repo.id}
            repository={repo}
            onRepositoryDelete={fetchRepositories}
          />
        ))}
      </List>
    </SidebarSection>
  );
}
