import { RepositoryList } from "../RepositoryList";
import { TitleBar } from "../../ui-components/TitleBar";

import "./WelcomeSidebar.css";
import { useModal } from "react-modal-hook";
import { UserSettingsModal } from "@renderer/components/UserSettingsModal";

export function WelcomeSidebar(): JSX.Element {
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
          label: "Open User Settings",
        }}
      />
      <RepositoryList />
    </div>
  );
}
