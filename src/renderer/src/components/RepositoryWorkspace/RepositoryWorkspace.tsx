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
        <div className="repository-title">
          {repositoryId} <button onClick={onRepositoryClose}>Close</button>
        </div>

        <div className="repository-content">Repository content</div>
      </div>
      <div className="table-workspace">
        RepositoryWorkspace : {repositoryId}
      </div>
    </div>
  );
}
