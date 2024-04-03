import { TitleBar } from "../../ui-components/TitleBar";
import "./RepositoryWorkspaceSidebar.css";
import {
  Repository,
  RepositoryStatus,
  TableMetadata,
} from "@sharedTypes/index";
import { RepositoryContent } from "../RepositoryContent";
import { SourceControl } from "../source-control/SourceControl";
import { DiffDescription } from "../editor-panel-group/EditorPanelGroup";

export type RepositoryWorkspaceSidebarProps = {
  repository: Repository;
  repositoryStatus: RepositoryStatus;
  onRepositoryClose: () => void;
  onRepositoryStatusChange: () => void;
  onTableSelect: (tableMetadata: TableMetadata) => void;
  onDiffSelect: (diff: DiffDescription) => void;
  onHistorySelect: () => void;
};

export function RepositoryWorkspaceSidebar({
  repository,
  repositoryStatus,
  onTableSelect,
  onDiffSelect,
  onRepositoryStatusChange,
  onRepositoryClose,
  onHistorySelect,
}: RepositoryWorkspaceSidebarProps): JSX.Element {
  return (
    <div
      className="repository-workspace-sidebar"
      aria-label="Repository workspace sidebar"
    >
      <TitleBar
        title={repository.name}
        aria-label="Title"
        action={{
          materialSymbol: "close",
          onClick: onRepositoryClose,
          label: "close repository",
        }}
      />
      <RepositoryContent
        repositoryId={repository.id}
        repositoryStatus={repositoryStatus}
        onTableSelect={onTableSelect}
      />
      <SourceControl
        repository={repository}
        repositoryStatus={repositoryStatus}
        onRepositoryStatusChange={onRepositoryStatusChange}
        onDiffSelect={onDiffSelect}
        onHistorySelect={onHistorySelect}
      />
    </div>
  );
}
