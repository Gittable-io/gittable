import { Repository } from "@sharedTypes/index";
import "./RepositoryWorkspace.css";

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
      <div className="respository-workspace-sidebar">
        <div className="repository-header">
          <div className="repository-title"> {repository.name} </div>
          <span
            className="material-icons md-18 close-button"
            onClick={onRepositoryClose}
          >
            close
          </span>
          {/* <button onClick={onRepositoryClose}>Close</button> */}
        </div>

        <div className="repository-content">Repository content</div>
      </div>
      <div className="table-workspace">
        RepositoryWorkspace : {repository.name}
      </div>
    </div>
  );
}
