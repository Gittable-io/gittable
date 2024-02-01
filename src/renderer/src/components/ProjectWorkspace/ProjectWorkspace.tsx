type ProjectWorkspaceProps = {
  projectPath: string;
};

export function ProjectWorkspace({
  projectPath,
}: ProjectWorkspaceProps): JSX.Element {
  return <div>ProjectWorkspace: {projectPath}</div>;
}
