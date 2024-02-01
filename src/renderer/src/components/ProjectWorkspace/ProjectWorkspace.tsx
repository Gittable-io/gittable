import "./ProjectWorkspace.css";

type ProjectWorkspaceProps = {
  projectPath: string;
};

export function ProjectWorkspace({
  projectPath,
}: ProjectWorkspaceProps): JSX.Element {
  return (
    <div className="project-workspace">
      <div className="project-structure">Project Structure</div>
      <div className="table-workspace">ProjectWorkspace : {projectPath}</div>
    </div>
  );
}
