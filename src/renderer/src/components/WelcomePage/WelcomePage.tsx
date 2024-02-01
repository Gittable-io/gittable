import { NewRepositorySection } from "../NewRepositorySection";
import "./WelcomePage.css";

type WelcomePageProps = {
  onProjectOpen: (projectPath: string) => void;
};

export function WelcomePage({ onProjectOpen }: WelcomePageProps): JSX.Element {
  return (
    <div className="welcome-page">
      <div className="available-repositories-section">
        available-repositories
      </div>
      <NewRepositorySection
        onProjectCreate={(projectPath) => onProjectOpen(projectPath)}
      />
      <div className="help-section">information-section</div>
    </div>
  );
}
