import { NewRepositorySection } from "../NewRepositorySection";
import { WelcomeSidebar } from "../WelcomeSidebar";
import "./WelcomePage.css";
import { InformationPanel } from "../InformationPanel";

type WelcomePageProps = {
  gitReady: boolean;
  onGitConfigChange: () => Promise<void>;
};

export function WelcomePage({
  gitReady,
  onGitConfigChange,
}: WelcomePageProps): JSX.Element {
  return (
    <div className="welcome-page">
      <WelcomeSidebar onGitConfigChange={onGitConfigChange} />
      {gitReady && <NewRepositorySection />}
      <InformationPanel
        gitReady={gitReady}
        onGitConfigChange={onGitConfigChange}
      />
    </div>
  );
}
