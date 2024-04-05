import { RepositoryListItem } from "../RepositoryListItem";
import { List } from "gittable-editor";
import "./RepositoryList.css";
import { SidebarSection } from "@renderer/components/ui-components/SidebarSection";
import { useSelector } from "react-redux";
import { AppRootState } from "@renderer/store/store";

export function RepositoryList(): JSX.Element {
  const repositories = useSelector(
    (state: AppRootState) => state.app.repositories,
  );

  return (
    <SidebarSection id="repository-list" title="Repositories">
      <List>
        {repositories.map((repo) => (
          <RepositoryListItem key={repo.id} repository={repo} />
        ))}
      </List>
    </SidebarSection>
  );
}
