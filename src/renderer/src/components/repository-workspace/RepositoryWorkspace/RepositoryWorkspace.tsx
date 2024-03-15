import { useCallback, useEffect, useState } from "react";
import type {
  Repository,
  RepositoryStatus,
  TableMetadata,
} from "@sharedTypes/index";
import { RepositoryWorkspaceSidebar } from "../RepositoryWorkspaceSidebar";
import { useTabs } from "react-headless-tabs";

import "./RepositoryWorkspace.css";
import {
  DiffDescription,
  EditorPanel,
  EditorPanelDescription,
  EditorPanelGroup,
  createEditorPanel,
} from "../editor-panel-group/EditorPanelGroup";

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

  const [openedEditorPanels, setOpenedEditorPanels] = useState<EditorPanel[]>(
    [],
  );
  const openedEditorPanelIds = openedEditorPanels.map((p) => p.id);

  const [selectedEditorPanelId, setSelectedEditorPanelId] =
    useTabs(openedEditorPanelIds);

  /* Helper functions */
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

  /* Function called by child components when they change the repository */
  // TODO: rename to onRepositoryStatusChange
  const onRepositoryChange = (): void => {
    console.debug(
      "[RepositoryWorkspace] Notified that repository status changed",
    );
    fetchRepositoryStatus();
  };

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

  const openEditorPanel = (panelDesc: EditorPanelDescription): void => {
    const panel = createEditorPanel(panelDesc);
    if (!openedEditorPanelIds.includes(panel.id)) {
      setOpenedEditorPanels([...openedEditorPanels, panel]);
    }
    setSelectedEditorPanelId(panel.id);
  };

  const closeEditorPanel = (panelId: string): void => {
    const positiondIdx = openedEditorPanelIds.findIndex((id) => id === panelId);
    if (positiondIdx !== -1) {
      // If we're closing the selected tab
      if (selectedEditorPanelId === panelId) {
        // If it's the last tab, set selection to null
        if (openedEditorPanelIds.length === 1) setSelectedEditorPanelId(null);
        // else if the selected tab is the last one to the right, select the tab to its left
        else if (positiondIdx === openedEditorPanelIds.length - 1)
          setSelectedEditorPanelId(openedEditorPanelIds[positiondIdx - 1]);
        // else select the tab to its right
        else setSelectedEditorPanelId(openedEditorPanelIds[positiondIdx + 1]);
      }

      setOpenedEditorPanels((tableIds) => [
        ...tableIds.slice(0, positiondIdx),
        ...tableIds.slice(positiondIdx + 1),
      ]);
    }
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
            onTableSelect={(tableMetadata: TableMetadata) =>
              openEditorPanel({ type: "table", table: tableMetadata })
            }
            onDiffSelect={(diff: DiffDescription) =>
              openEditorPanel({ type: "diff", ...diff })
            }
          />
          <EditorPanelGroup
            repositoryId={repository.id}
            openedEditorPanels={openedEditorPanels}
            selectedEditorPanelId={selectedEditorPanelId ?? null}
            onSelectEditorPanel={(editorPanelId) =>
              setSelectedEditorPanelId(editorPanelId)
            }
            onCloseEditorPanel={closeEditorPanel}
          />
        </>
      )}
    </div>
  );
}
