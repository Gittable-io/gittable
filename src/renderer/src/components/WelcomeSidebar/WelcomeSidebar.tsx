import { Repository } from "@sharedTypes/index";
import { RepositoryList } from "../RepositoryList";

import "./WelcomeSidebar.css";

type WelcomeSidebarProps = {
  onRepositorySelect: (repository: Repository) => void;
};

export function WelcomeSidebar({
  onRepositorySelect,
}: WelcomeSidebarProps): JSX.Element {
  return (
    <div className="welcome-sidebar">
      <div className="logo">Gittable</div>
      <RepositoryList onRepositorySelect={onRepositorySelect} />
    </div>
  );
}
