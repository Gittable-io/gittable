import { useCallback, useEffect, useState } from "react";
import type {
  Repository,
  RepositoryStatus,
  TableMetadata,
} from "@sharedTypes/index";
import { RepositoryWorkspaceSidebar } from "../RepositoryWorkspaceSidebar";
import { TableWorkspace } from "../TableWorkspace";
import { Tab } from "@headlessui/react";
import { IconAndText, MaterialSymbol } from "gittable-editor";

import "./RepositoryWorkspace.css";

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

  const [openedTableIds, setOpenedTableIds] = useState<string[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

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

  const openTable = (tableId: string): void => {
    if (!openedTableIds.includes(tableId)) {
      setOpenedTableIds((tableIds) => [...tableIds, tableId]);
    }
    setSelectedTableId(tableId);
  };

  const closeTable = (tableId: string): void => {
    const positiondIdx = openedTableIds.findIndex((id) => id === tableId);
    if (positiondIdx !== -1) {
      // If we're closing the selected tab
      if (selectedTableId === tableId) {
        // If it's the last tab, set selection to null
        if (openedTableIds.length === 1) setSelectedTableId(null);
        // else if the selected tab is the last one to the right, select the tab to its left
        else if (positiondIdx === openedTableIds.length - 1)
          setSelectedTableId(openedTableIds[positiondIdx - 1]);
        // else select the tab to its right
        else setSelectedTableId(openedTableIds[positiondIdx + 1]);
      }

      setOpenedTableIds((tableIds) => [
        ...tableIds.slice(0, positiondIdx),
        ...tableIds.slice(positiondIdx + 1),
      ]);
    }
  };

  const getTableMetadata = (tableId: string): TableMetadata | undefined => {
    return repositoryStatus?.tables.find((table) => table.id === tableId);
  };

  const selectedTableIdx = openedTableIds.findIndex(
    (tableId) => tableId === selectedTableId,
  );

  return (
    <div className="repository-workspace">
      {repositoryStatus && (
        <>
          <RepositoryWorkspaceSidebar
            repository={repository}
            repositoryStatus={repositoryStatus}
            onRepositoryClose={onRepositoryClose}
            onRepositoryChange={onRepositoryChange}
            onTableSelect={(tableId) => openTable(tableId)}
          />
          {openedTableIds.length > 0 && (
            <div className="tab-group">
              <Tab.Group
                selectedIndex={selectedTableIdx}
                onChange={(tabIdx) =>
                  setSelectedTableId(openedTableIds[tabIdx])
                }
              >
                <Tab.List className="tab-list">
                  {openedTableIds.map((tableId) => (
                    <Tab key={tableId} className="tab-label">
                      <IconAndText
                        text={getTableMetadata(tableId)?.name}
                        materialSymbol="table"
                      />
                      <MaterialSymbol
                        symbol="close"
                        onClick={() => closeTable(tableId)}
                      />
                    </Tab>
                  ))}
                </Tab.List>
                <Tab.Panels className="tab-panels">
                  {openedTableIds.map((tableId) => (
                    <Tab.Panel key={tableId} unmount={false}>
                      <TableWorkspace
                        key={tableId}
                        repositoryId={repository.id}
                        tableMetadata={getTableMetadata(tableId)!}
                      />
                    </Tab.Panel>
                  ))}
                </Tab.Panels>
              </Tab.Group>
            </div>
          )}
        </>
      )}
    </div>
  );
}
