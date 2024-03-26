import { Repository } from "@sharedTypes/index";
import { NewRepositorySection } from "../NewRepositorySection";
import { WelcomeSidebar } from "../WelcomeSidebar";
import "./WelcomePage.css";
import { InformationPanel } from "../InformationPanel";

type WelcomePageProps = {
  onRepositorySelect: (repository: Repository) => void;
  gitReady: boolean;
  onGitConfigChange: () => Promise<void>;
};

export function WelcomePage({
  onRepositorySelect,
  gitReady,
  onGitConfigChange,
}: WelcomePageProps): JSX.Element {
  return (
    <div className="welcome-page">
      <WelcomeSidebar
        onRepositorySelect={onRepositorySelect}
        onGitConfigChange={onGitConfigChange}
      />
      {gitReady && (
        <NewRepositorySection
          onRepositoryClone={(repository) => onRepositorySelect(repository)}
        />
      )}
      <InformationPanel
        gitReady={gitReady}
        onGitConfigChange={onGitConfigChange}
      />
    </div>
  );
}
