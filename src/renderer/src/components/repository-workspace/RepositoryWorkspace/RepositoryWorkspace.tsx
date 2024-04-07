import { useCallback, useEffect, useState } from "react";
import type { RepositoryStatus, TableMetadata } from "@sharedTypes/index";
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
import { useSelector } from "react-redux";
import { AppRootState } from "@renderer/store/store";

export function RepositoryWorkspace(): JSX.Element {
  const openedRepository = useSelector(
    (state: AppRootState) => state.app.openedRepository,
  )!;

  //#region State & Derived state
  const [repositoryStatus, setRepositoryStatus] =
    useState<RepositoryStatus | null>(null);

  const [openedEditorPanels, setOpenedEditorPanels] = useState<EditorPanel[]>(
    [],
  );
  const openedEditorPanelIds = openedEditorPanels.map((p) => p.id);

  const [selectedEditorPanelId, setSelectedEditorPanelId] =
    useTabs(openedEditorPanelIds);

  //#endregion

  //#region Helper functions

  /**
   * Fetches the repository status and updates the state
   *
   * @return {RepositoryStatus} Returns the repository status
   */
  const fetchRepositoryStatus =
    useCallback(async (): Promise<RepositoryStatus> => {
      const response = await window.api.get_repository_status({
        repositoryId: openedRepository.id,
      });
      if (response.status === "success") {
        return response.repositoryStatus;
      } else {
        throw new Error(
          "[RepositoryWorkspace] Couldn't retrieve last commit id",
        );
      }
    }, [openedRepository]);

  const fetchAndUpdateRepositoryStatus =
    useCallback(async (): Promise<void> => {
      // Fetch repository status
      const repositoryStatus = await fetchRepositoryStatus();

      // Update the state with the repository status
      setRepositoryStatus(repositoryStatus);
    }, [fetchRepositoryStatus]);

  const onRepositoryStatusChange = (): void => {
    console.debug(
      "[RepositoryWorkspace] Notified that repository status changed",
    );
    fetchAndUpdateRepositoryStatus();
  };

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
  //#endregion

  //#region Side effects
  /**
   * @sideeffect: at mount and each 5s, update Repository status
   */
  useEffect(() => {
    fetchAndUpdateRepositoryStatus();

    /*
    ? Why do I need to poll the repository status. We can argue that it is not needed, if every child component that does changes notifies it with onRepositoryChange()
    ? But I argue that we need to poll, as we can have a user that externally changes files outside of the application (using a Git GUI for exemple)
    */
    const intervalId = setInterval(fetchAndUpdateRepositoryStatus, 5000);
    return () => clearInterval(intervalId);
  }, [fetchAndUpdateRepositoryStatus]);
  //#endregion

  return (
    <div className="repository-workspace">
      {repositoryStatus && (
        <>
          <RepositoryWorkspaceSidebar
            repositoryStatus={repositoryStatus}
            onRepositoryStatusChange={onRepositoryStatusChange}
            onTableSelect={(tableMetadata: TableMetadata) =>
              openEditorPanel({ type: "table", table: tableMetadata })
            }
            onDiffSelect={(diff: DiffDescription) =>
              openEditorPanel({ type: "diff", diff })
            }
            onHistorySelect={() => openEditorPanel({ type: "history" })}
          />
          <EditorPanelGroup
            repositoryId={openedRepository.id}
            repositoryStatus={repositoryStatus}
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
