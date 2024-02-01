import "./RepositoryWorkspace.css";

type RepositoryWorkspaceProps = {
  repositoryId: string;
};

export function RepositoryWorkspace({
  repositoryId,
}: RepositoryWorkspaceProps): JSX.Element {
  return (
    <div className="repository-workspace">
      <div className="repository-content">Repository content</div>
      <div className="table-workspace">
        RepositoryWorkspace : {repositoryId}
      </div>
    </div>
  );
}
