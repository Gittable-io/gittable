import { NewRepoSection } from "../NewRepoSection";
import "./WelcomePage.css";

type WelcomePageProps = {
  onProjectOpen: (projectPath: string) => void;
};

export function WelcomePage({ onProjectOpen }: WelcomePageProps): JSX.Element {
  return (
    <div className="welcome-page">
      <div className="available-repos-section">available-repos</div>
      <NewRepoSection
        onProjectCreate={(projectPath) => onProjectOpen(projectPath)}
      />
      <div className="help-section">information-section</div>
    </div>
  );
}
