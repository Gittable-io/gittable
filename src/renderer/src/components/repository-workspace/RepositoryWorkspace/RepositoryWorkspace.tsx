import { useCallback, useEffect, useState } from "react";
import type {
  Repository,
  RepositoryStatus,
  TableMetadata,
} from "@sharedTypes/index";
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
  const [repositoryStatus, setRepositoryStatus] =
    useState<RepositoryStatus | null>(null);
  const [openedTable, setOpenedTable] = useState<TableMetadata | null>(null);

  const fetchRepositoryStatus = useCallback(async (): Promise<void> => {
    const response = await window.api.get_repository_status({
      repositoryId: repository.id,
    });
    if (response.status === "success") {
      setRepositoryStatus(response.repositoryStatus);
    } else {
      console.error("[RepositoryWorkspace] Couldn't retrieve last commit id");
    }
  }, [repository]);

  /**
   * @sideeffect: at mount and each 5s, update Repository status
   */
  useEffect(() => {
    fetchRepositoryStatus();

    /*
    ? Why do I need to poll the repository status. We can argue that it is not needed, if every child component that does changes notifies it with onRepositoryChange()
    ? But I argue that we need to poll, as we can have a user that externally changes files outside of the application (using a Git GUI for exemple)
    */
    const intervalId = setInterval(fetchRepositoryStatus, 5000);
    return () => clearInterval(intervalId);
  }, [fetchRepositoryStatus]);

  /* Function called by child components when they change the repository */
  const onRepositoryChange = (): void => {
    console.debug(
      "[RepositoryWorkspace] Notified that repository status changed",
    );
    fetchRepositoryStatus();
  };

  return (
    <div className="repository-workspace">
      {repositoryStatus && (
        <>
          <RepositoryWorkspaceSidebar
            repository={repository}
            repositoryStatus={repositoryStatus}
            onRepositoryClose={onRepositoryClose}
            onRepositoryChange={onRepositoryChange}
            onTableSelect={(tableMetadata) => setOpenedTable(tableMetadata)}
          />
          {openedTable && (
            <TableWorkspace
              repositoryId={repository.id}
              tableMetadata={openedTable}
            />
          )}
        </>
      )}
    </div>
  );
}
