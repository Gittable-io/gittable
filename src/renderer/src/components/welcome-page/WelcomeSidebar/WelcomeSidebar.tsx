import { Repository } from "@sharedTypes/index";
import { RepositoryList } from "../RepositoryList";
import { TitleBar } from "../../ui-components/TitleBar";

import "./WelcomeSidebar.css";
import { useModal } from "react-modal-hook";
import { UserSettingsModal } from "@renderer/components/UserSettingsModal";

type WelcomeSidebarProps = {
  onRepositorySelect: (repository: Repository) => void;
};

export function WelcomeSidebar({
  onRepositorySelect,
}: WelcomeSidebarProps): JSX.Element {
  const [showUserSettingsModal, hideUserSettingsModal] = useModal(() => (
    <UserSettingsModal onClose={hideUserSettingsModal} />
  ));

  return (
    <div className="welcome-sidebar">
      <TitleBar
        title="Gittable"
        action={{
          materialSymbol: "settings",
          onClick: showUserSettingsModal,
        }}
      />
      <RepositoryList onRepositorySelect={onRepositorySelect} />
    </div>
  );
}
