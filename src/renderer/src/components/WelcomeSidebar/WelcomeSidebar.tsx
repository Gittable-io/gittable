import { RepositoryList } from "../RepositoryList";

import "./WelcomeSidebar.css";

type WelcomeSidebarProps = {
  onRepositorySelect: (projectPath: string) => void;
};

export function WelcomeSidebar({
  onRepositorySelect,
}: WelcomeSidebarProps): JSX.Element {
  return (
    <div className="welcome-sidebar">
      <div className="logo">Gittable</div>
      <RepositoryList onProjectSelect={onRepositorySelect} />
    </div>
  );
}
