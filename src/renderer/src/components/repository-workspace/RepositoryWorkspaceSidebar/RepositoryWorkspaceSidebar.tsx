import { TitleBar } from "../../ui-components/TitleBar";
import "./RepositoryWorkspaceSidebar.css";
import {
  Repository,
  RepositoryStatus,
  TableMetadata,
} from "@sharedTypes/index";
import { RepositoryContent } from "../RepositoryContent";
import { SourceControl } from "../SourceControl";
import { DiffDescription } from "../editor-panel-group/EditorPanelGroup";

export type RepositoryWorkspaceSidebarProps = {
  repository: Repository;
  repositoryStatus: RepositoryStatus;
  onRepositoryClose: () => void;
  onRepositoryChange: () => void;
  onTableSelect: (tableMetadata: TableMetadata) => void;
  onDiffSelect: (diff: DiffDescription) => void;
};

export function RepositoryWorkspaceSidebar({
  repository,
  repositoryStatus,
  onTableSelect,
  onDiffSelect,
  onRepositoryChange,
  onRepositoryClose,
}: RepositoryWorkspaceSidebarProps): JSX.Element {
  return (
    <div className="repository-workspace-sidebar">
      <TitleBar
        title={repository.name}
        action={{
          materialSymbol: "close",
          onClick: onRepositoryClose,
          testId: "close repository",
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
        onRepositoryChange={onRepositoryChange}
        onDiffSelect={onDiffSelect}
      />
    </div>
  );
}
