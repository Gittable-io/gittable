import { RepositoryList } from "../RepositoryList";

import "./WelcomeSidebar.css";

export function WelcomeSidebar(): JSX.Element {
  return (
    <div className="welcome-sidebar">
      <div className="logo">Gittable</div>
      <RepositoryList />
    </div>
  );
}
