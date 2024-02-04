import { Repository } from "@sharedTypes/index";
import { NewRepositorySection } from "../NewRepositorySection";
import { WelcomeSidebar } from "../WelcomeSidebar";
import "./WelcomePage.css";

type WelcomePageProps = {
  onRepositorySelect: (repository: Repository) => void;
};

export function WelcomePage({
  onRepositorySelect,
}: WelcomePageProps): JSX.Element {
  return (
    <div className="welcome-page">
      <WelcomeSidebar onRepositorySelect={onRepositorySelect} />
      <NewRepositorySection
        onRepositoryClone={(repository) => onRepositorySelect(repository)}
      />
      <div className="help-section">information-section</div>
    </div>
  );
}
