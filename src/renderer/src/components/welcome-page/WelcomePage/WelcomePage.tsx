import { NewRepositorySection } from "../NewRepositorySection";
import { WelcomeSidebar } from "../WelcomeSidebar";
import "./WelcomePage.css";
import { InformationPanel } from "../InformationPanel";
import { useSelector } from "react-redux";
import { appSelectors } from "@renderer/store/appSlice";
import { AppRootState } from "@renderer/store/store";

export function WelcomePage(): JSX.Element {
  const gitReady: boolean = useSelector((state: AppRootState) =>
    appSelectors.isGitConfigured(state),
  );

  return (
    <div className="welcome-page">
      <WelcomeSidebar />
      {gitReady && <NewRepositorySection />}
      <InformationPanel />
    </div>
  );
}
