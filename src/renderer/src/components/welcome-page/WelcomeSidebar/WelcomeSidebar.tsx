import { Repository } from "@sharedTypes/index";
import { RepositoryList } from "../RepositoryList";
import { TitleBar } from "../../ui-components/TitleBar";

import "./WelcomeSidebar.css";

type WelcomeSidebarProps = {
  onRepositorySelect: (repository: Repository) => void;
};

export function WelcomeSidebar({
  onRepositorySelect,
}: WelcomeSidebarProps): JSX.Element {
  return (
    <div className="welcome-sidebar">
      <TitleBar title="Gittable" />
      <RepositoryList onRepositorySelect={onRepositorySelect} />
    </div>
  );
}
