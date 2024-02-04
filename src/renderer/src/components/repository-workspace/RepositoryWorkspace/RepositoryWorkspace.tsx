import { Repository } from "@sharedTypes/index";
import "./RepositoryWorkspace.css";
import { RepositoryWorkspaceSidebar } from "../RepositoryWorkspaceSidebar";

type RepositoryWorkspaceProps = {
  repository: Repository;
  onRepositoryClose: () => void;
};

export function RepositoryWorkspace({
  repository,
  onRepositoryClose,
}: RepositoryWorkspaceProps): JSX.Element {
  return (
    <div className="repository-workspace">
      <RepositoryWorkspaceSidebar
        repository={repository}
        onRepositoryClose={onRepositoryClose}
      />
      <div className="table-workspace">
        RepositoryWorkspace : {repository.name}
      </div>
    </div>
  );
}
