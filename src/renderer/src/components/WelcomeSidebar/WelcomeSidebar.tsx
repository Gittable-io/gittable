import "./WelcomeSidebar.css";

export function WelcomeSidebar(): JSX.Element {
  return (
    <div className="welcome-sidebar">
      <div className="logo">Gittable</div>
      <div className="repositories-list">Repositories List</div>
    </div>
  );
}
