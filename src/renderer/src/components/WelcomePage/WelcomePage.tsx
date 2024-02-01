import { NewRepositorySection } from "../NewRepositorySection";
import { WelcomeSidebar } from "../WelcomeSidebar";
import "./WelcomePage.css";

type WelcomePageProps = {
  onRepositorySelect: (repositoryId: string) => void;
};

export function WelcomePage({
  onRepositorySelect,
}: WelcomePageProps): JSX.Element {
  return (
    <div className="welcome-page">
      <WelcomeSidebar onRepositorySelect={onRepositorySelect} />
      <NewRepositorySection
        onRepositoryClone={(repositoryId) => onRepositorySelect(repositoryId)}
      />
      <div className="help-section">information-section</div>
    </div>
  );
}
