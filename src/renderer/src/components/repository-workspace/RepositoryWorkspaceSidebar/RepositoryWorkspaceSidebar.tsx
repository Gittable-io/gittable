import { TitleBar } from "../../ui-components/TitleBar";
import "./RepositoryWorkspaceSidebar.css";
import { Repository, TableMetadata } from "@sharedTypes/index";
import { RepositoryContent } from "../RepositoryContent";
import { SourceControl } from "../SourceControl";

export type RepositoryWorkspaceSidebarProps = {
  repository: Repository;
  onRepositoryClose: () => void;
  onTableSelect: (tableMetadata: TableMetadata) => void;
};

export function RepositoryWorkspaceSidebar({
  repository,
  onTableSelect,
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
        onTableSelect={onTableSelect}
      />
      <SourceControl repositoryId={repository.id} />
    </div>
  );
}
