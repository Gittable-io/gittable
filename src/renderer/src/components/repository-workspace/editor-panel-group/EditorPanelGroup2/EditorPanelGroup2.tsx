import { useDispatch, useSelector } from "react-redux";
import "./EditorPanelGroup.css";
import { AppDispatch, AppRootState } from "@renderer/store/store";
import { TabPanel } from "react-headless-tabs";
import { Panel, repoActions } from "@renderer/store/repoSlice";
import { IconAndText, MaterialSymbolButton } from "gittable-editor";
import { TableEditorPanel } from "../TableEditorPanel";
import { TableDiffViewerPanel } from "../TableDiffViewerPanel";

const getPanelTitle = (panel: Panel): string => {
  return panel.type === "table"
    ? panel.table.name
    : `${panel.diff.table.name} (diff)`;
};

export function EditorPanelGroup2(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  const panels = useSelector((state: AppRootState) => state.repo.panels);
  const selectedPanelId = useSelector(
    (state: AppRootState) => state.repo.selectedPanelId,
  );

  return (
    <div className="editor-panel-group">
      {panels.length > 0 && (
        <>
          <div className="tab-list" role="tablist">
            {panels.map((panel) => (
              <div
                key={panel.id}
                role="tab"
                className={`tab-label ${panel.id === selectedPanelId ? "selected" : ""}`}
                data-tab-id={panel.id}
                data-tab-title={getPanelTitle(panel)}
                onClick={() => dispatch(repoActions.selectPanel(panel.id))}
              >
                <IconAndText
                  text={getPanelTitle(panel)}
                  materialSymbol="table"
                />
                <MaterialSymbolButton
                  symbol="close"
                  label="Close tab"
                  onClick={() => dispatch(repoActions.closePanel(panel.id))}
                />
              </div>
            ))}
          </div>
          <div className="tab-panels">
            {panels.map((panel) => (
              <TabPanel
                key={panel.id}
                className="tab-panel"
                role="tabpanel"
                hidden={panel.id !== selectedPanelId}
                unmount="never"
              >
                {panel.type === "table" ? (
                  <TableEditorPanel
                    key={panel.table.id}
                    tableMetadata={panel.table}
                    hidden={panel.id !== selectedPanelId}
                  />
                ) : (
                  <TableDiffViewerPanel
                    diffDescription={panel.diff}
                    hidden={panel.id !== selectedPanelId}
                  />
                )}
              </TabPanel>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
