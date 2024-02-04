import { TitleBar } from "../../ui-components/TitleBar";
import "./RepositoryWorkspaceSidebar.css";
import { Repository } from "@sharedTypes/index";
import { RepositoryContent } from "../RepositoryContent";

export type RepositoryWorkspaceSidebarProps = {
  repository: Repository;
  onRepositoryClose: () => void;
};

export function RepositoryWorkspaceSidebar({
  repository,
  onRepositoryClose,
}: RepositoryWorkspaceSidebarProps): JSX.Element {
  return (
    <div className="repository-workspace-sidebar">
      <TitleBar
        title={repository.name}
        action={{ materialSymbol: "close", onClick: onRepositoryClose }}
      />
      <RepositoryContent />
    </div>
  );
}
