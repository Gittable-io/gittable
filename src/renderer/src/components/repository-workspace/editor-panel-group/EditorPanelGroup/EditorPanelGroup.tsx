import "./EditorPanelGroup.css";
import { IconAndText, MaterialSymbolButton } from "gittable-editor";
import { TabPanel } from "react-headless-tabs";
import { TableEditorPanel } from "../TableEditorPanel";
import { TableMetadata } from "@sharedTypes/index";
import { TableDiffViewerPanel } from "../TableDiffViewerPanel";
import { HistoryPanel } from "../HistoryPanel";

export type DiffDescription = {
  table: TableMetadata;
  fromRef: "HEAD";
  toRef: "WorkingDir";
};

export type EditorPanelDescription =
  | {
      type: "table";
      table: TableMetadata;
    }
  | {
      type: "diff";
      diff: DiffDescription;
    }
  | {
      type: "history";
    };

export type EditorPanel = {
  id: string;
  title: string;
} & EditorPanelDescription;

export const createEditorPanel = (
  panel: EditorPanelDescription,
): EditorPanel => {
  const id =
    panel.type === "table"
      ? `${panel.type}_${panel.table.id}`
      : panel.type === "diff"
        ? `${panel.type}_${panel.diff.table.id}_${panel.diff.fromRef}_${panel.diff.toRef}`
        : "history";

  const title =
    panel.type === "table"
      ? `${panel.table.name}`
      : panel.type === "diff"
        ? `${panel.diff.table.name} (diff)`
        : "History";

  return {
    id,
    title,
    ...panel,
  };
};

export type EditorPanelGroupProps = {
  repositoryId: string;
  openedEditorPanels: EditorPanel[];
  selectedEditorPanelId: string | null;
  onSelectEditorPanel: (editorPanelId: string) => void;
  onCloseEditorPanel: (editorPanelId: string) => void;
};

export function EditorPanelGroup({
  repositoryId,
  openedEditorPanels,
  selectedEditorPanelId,
  onSelectEditorPanel: onSelectEditorPanel,
  onCloseEditorPanel: onCloseEditorPanel,
}: EditorPanelGroupProps): JSX.Element {
  return (
    <div className="editor-panel-group">
      {openedEditorPanels.length > 0 && (
        <>
          <div className="tab-list" role="tablist">
            {openedEditorPanels.map((panel) => (
              <div
                key={panel.id}
                role="tab"
                className={`tab-label ${panel.id === selectedEditorPanelId ? "selected" : ""}`}
                data-tab-id={panel.id}
                data-tab-title={panel.title}
                onClick={() => onSelectEditorPanel(panel.id)}
              >
                <IconAndText text={panel.title} materialSymbol="table" />
                <MaterialSymbolButton
                  symbol="close"
                  label="Close tab"
                  onClick={() => onCloseEditorPanel(panel.id)}
                />
              </div>
            ))}
          </div>
          <div className="tab-panels">
            {openedEditorPanels.map((panel) => (
              <TabPanel
                key={panel.id}
                className="tab-panel"
                role="tabpanel"
                hidden={panel.id !== selectedEditorPanelId}
                unmount="never"
              >
                {panel.type === "table" ? (
                  <TableEditorPanel
                    key={panel.table.id}
                    repositoryId={repositoryId}
                    tableMetadata={panel.table}
                    hidden={panel.id !== selectedEditorPanelId}
                  />
                ) : panel.type === "diff" ? (
                  <TableDiffViewerPanel
                    repositoryId={repositoryId}
                    diffDescription={panel.diff}
                    hidden={panel.id !== selectedEditorPanelId}
                  />
                ) : (
                  <HistoryPanel />
                )}
              </TabPanel>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
