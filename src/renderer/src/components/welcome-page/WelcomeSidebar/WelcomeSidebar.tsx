import { Repository } from "@sharedTypes/index";
import { RepositoryList } from "../RepositoryList";
import { TitleBar } from "../../ui-components/TitleBar";

import "./WelcomeSidebar.css";
import { useModal } from "react-modal-hook";
import { UserSettingsModal } from "@renderer/components/UserSettingsModal";

type WelcomeSidebarProps = {
  onRepositorySelect: (repository: Repository) => void;
  onGitConfigChange: () => Promise<void>;
};

export function WelcomeSidebar({
  onRepositorySelect,
  onGitConfigChange,
}: WelcomeSidebarProps): JSX.Element {
  const [showUserSettingsModal, hideUserSettingsModal] = useModal(() => (
    <UserSettingsModal
      onClose={hideUserSettingsModal}
      onGitConfigChange={onGitConfigChange}
    />
  ));

  return (
    <div className="welcome-sidebar">
      <TitleBar
        title="Gittable"
        action={{
          materialSymbol: "settings",
          onClick: showUserSettingsModal,
          testId: "Open User Settings",
        }}
      />
      <RepositoryList onRepositorySelect={onRepositorySelect} />
    </div>
  );
}
