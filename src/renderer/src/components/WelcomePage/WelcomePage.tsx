import { NewRepoSection } from "../NewRepoSection";
import "./WelcomePage.css";

export function WelcomePage(): JSX.Element {
  return (
    <div className="welcome-page">
      <div className="available-repos-section">available-repos</div>
      <NewRepoSection />
      <div className="help-section">information-section</div>
    </div>
  );
}
