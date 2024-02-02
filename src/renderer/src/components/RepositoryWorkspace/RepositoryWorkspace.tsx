import "./RepositoryWorkspace.css";

type RepositoryWorkspaceProps = {
  repositoryId: string;
  onRepositoryClose: () => void;
};

export function RepositoryWorkspace({
  repositoryId,
  onRepositoryClose,
}: RepositoryWorkspaceProps): JSX.Element {
  return (
    <div className="repository-workspace">
      <div className="respository-workspace-sidebar">
        <div className="repository-header">
          <div className="repository-title"> {repositoryId} </div>
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
        RepositoryWorkspace : {repositoryId}
      </div>
    </div>
  );
}
