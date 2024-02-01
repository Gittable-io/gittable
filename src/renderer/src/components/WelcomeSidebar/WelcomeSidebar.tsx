import { RepositoryList } from "../RepositoryList";

import "./WelcomeSidebar.css";

type WelcomeSidebarProps = {
  onProjectSelect: (projectPath: string) => void;
};

export function WelcomeSidebar({
  onProjectSelect,
}: WelcomeSidebarProps): JSX.Element {
  return (
    <div className="welcome-sidebar">
      <div className="logo">Gittable</div>
      <RepositoryList onProjectSelect={onProjectSelect} />
    </div>
  );
}
