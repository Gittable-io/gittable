import { NewRepositorySection } from "../NewRepositorySection";
import { WelcomeSidebar } from "../WelcomeSidebar";
import "./WelcomePage.css";

type WelcomePageProps = {
  onProjectOpen: (projectPath: string) => void;
};

export function WelcomePage({ onProjectOpen }: WelcomePageProps): JSX.Element {
  return (
    <div className="welcome-page">
      <WelcomeSidebar onProjectSelect={onProjectOpen} />
      <NewRepositorySection
        onProjectCreate={(projectPath) => onProjectOpen(projectPath)}
      />
      <div className="help-section">information-section</div>
    </div>
  );
}
