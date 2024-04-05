import { TitleBar } from "../../ui-components/TitleBar";
import "./RepositoryWorkspaceSidebar.css";
import { RepositoryStatus, TableMetadata } from "@sharedTypes/index";
import { RepositoryContent } from "../RepositoryContent";
import { SourceControl } from "../source-control/SourceControl";
import { DiffDescription } from "../editor-panel-group/EditorPanelGroup";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, AppRootState } from "@renderer/store/store";
import { appActions } from "@renderer/store/appSlice";

export type RepositoryWorkspaceSidebarProps = {
  repositoryStatus: RepositoryStatus;
  onRepositoryStatusChange: () => void;
  onTableSelect: (tableMetadata: TableMetadata) => void;
  onDiffSelect: (diff: DiffDescription) => void;
  onHistorySelect: () => void;
};

export function RepositoryWorkspaceSidebar({
  repositoryStatus,
  onTableSelect,
  onDiffSelect,
  onRepositoryStatusChange,
  onHistorySelect,
}: RepositoryWorkspaceSidebarProps): JSX.Element {
  const openedRepository = useSelector(
    (state: AppRootState) => state.app.openedRepository,
  )!;
  const dispatch = useDispatch<AppDispatch>();

  return (
    <div
      className="repository-workspace-sidebar"
      aria-label="Repository workspace sidebar"
    >
      <TitleBar
        title={openedRepository.name}
        aria-label="Title"
        action={{
          materialSymbol: "close",
          onClick: () => dispatch(appActions.closeRepository()),
          label: "close repository",
        }}
      />
      <RepositoryContent
        repositoryId={openedRepository.id}
        repositoryStatus={repositoryStatus}
        onTableSelect={onTableSelect}
      />
      <SourceControl
        repository={openedRepository}
        repositoryStatus={repositoryStatus}
        onRepositoryStatusChange={onRepositoryStatusChange}
        onDiffSelect={onDiffSelect}
        onHistorySelect={onHistorySelect}
      />
    </div>
  );
}
