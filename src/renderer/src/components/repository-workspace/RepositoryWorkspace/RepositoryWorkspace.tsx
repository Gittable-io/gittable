import { useState } from "react";
import type { Repository, TableMetadata } from "@sharedTypes/index";
import "./RepositoryWorkspace.css";
import { RepositoryWorkspaceSidebar } from "../RepositoryWorkspaceSidebar";
import { TableWorkspace } from "../TableWorkspace";

type RepositoryWorkspaceProps = {
  repository: Repository;
  onRepositoryClose: () => void;
};

export function RepositoryWorkspace({
  repository,
  onRepositoryClose,
}: RepositoryWorkspaceProps): JSX.Element {
  const [openedTable, setOpenedTable] = useState<TableMetadata | null>(null);

  return (
    <div className="repository-workspace">
      <RepositoryWorkspaceSidebar
        repository={repository}
        onRepositoryClose={onRepositoryClose}
        onTableSelect={(tableMetadata) => setOpenedTable(tableMetadata)}
      />
      {openedTable && (
        <TableWorkspace
          repositoryId={repository.id}
          tableMetadata={openedTable}
        />
      )}
    </div>
  );
}
