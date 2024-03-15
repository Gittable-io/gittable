import "./EditorPanelGroup.css";
import { IconAndText, MaterialSymbol } from "gittable-editor";
import { TabPanel } from "react-headless-tabs";
import { TableWorkspace } from "../TableWorkspace";
import { EditorPanel } from "../RepositoryWorkspace";

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
                data-tab-title={panel.table.name}
                onClick={() => onSelectEditorPanel(panel.id)}
              >
                <IconAndText text={panel.table.name} materialSymbol="table" />
                <MaterialSymbol
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
                <TableWorkspace
                  key={panel.table.id}
                  repositoryId={repositoryId}
                  tableMetadata={panel.table}
                  hidden={panel.id !== selectedEditorPanelId}
                />
              </TabPanel>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
