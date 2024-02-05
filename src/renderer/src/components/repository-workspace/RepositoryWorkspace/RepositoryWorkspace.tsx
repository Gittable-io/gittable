import { useState } from "react";
import { Repository } from "@sharedTypes/index";
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
  const [openedTable, setOpenedTable] = useState<string | null>(null);

  return (
    <div className="repository-workspace">
      <RepositoryWorkspaceSidebar
        repository={repository}
        onRepositoryClose={onRepositoryClose}
        onTableSelect={(table) => setOpenedTable(table)}
      />
      {openedTable && (
        <TableWorkspace
          repositoryId={repository.id}
          tableFileName={openedTable}
        />
      )}
    </div>
  );
}
