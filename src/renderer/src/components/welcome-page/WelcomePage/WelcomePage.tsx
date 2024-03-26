import { Repository } from "@sharedTypes/index";
import { NewRepositorySection } from "../NewRepositorySection";
import { WelcomeSidebar } from "../WelcomeSidebar";
import "./WelcomePage.css";
import { InformationPanel } from "../InformationPanel";

type WelcomePageProps = {
  onRepositorySelect: (repository: Repository) => void;
  gitReady: boolean;
};

export function WelcomePage({
  onRepositorySelect,
  gitReady,
}: WelcomePageProps): JSX.Element {
  return (
    <div className="welcome-page">
      <WelcomeSidebar onRepositorySelect={onRepositorySelect} />
      {gitReady && (
        <NewRepositorySection
          onRepositoryClone={(repository) => onRepositorySelect(repository)}
        />
      )}
      <InformationPanel gitReady={gitReady} />
    </div>
  );
}
