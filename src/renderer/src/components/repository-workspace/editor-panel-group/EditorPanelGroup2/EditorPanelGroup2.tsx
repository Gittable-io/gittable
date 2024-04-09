import { useDispatch, useSelector } from "react-redux";
import "./EditorPanelGroup.css";
import { AppDispatch, AppRootState } from "@renderer/store/store";
import { TabPanel } from "react-headless-tabs";
import { Panel, repoActions } from "@renderer/store/repoSlice";
import { IconAndText, MaterialSymbolButton } from "gittable-editor";
import { TableDiffViewerPanel } from "../TableDiffViewerPanel";
import { TableViewerPanel } from "../TableViewerPanel";
import { TableEditorPanel } from "../TableEditorPanel";
import { ReviewPanel } from "../ReviewPanel";

const getPanelTitle = (panel: Panel): string => {
  switch (panel.type) {
    case "table":
      return panel.table.name;
    case "diff":
      return `${panel.diff.table.name} (diff)`;
    case "review_current_version":
      return "Review";
  }
};

const getPanelSymbol = (panel: Panel): string => {
  switch (panel.type) {
    case "table":
      return "table";
    case "diff":
      return "table_view";
    case "review_current_version":
      return "fact_check";
  }
};

export function EditorPanelGroup2(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  const panels = useSelector((state: AppRootState) => state.repo.panels);
  const selectedPanelId = useSelector(
    (state: AppRootState) => state.repo.selectedPanelId,
  );
  const isDraft = useSelector(
    (state: AppRootState) => state.repo.currentVersion?.type === "draft",
  );

  const renderPanel = (panel: Panel): JSX.Element => {
    switch (panel.type) {
      case "table": {
        if (isDraft) {
          return (
            <TableEditorPanel
              key={panel.table.id}
              tableMetadata={panel.table}
              hidden={panel.id !== selectedPanelId}
            />
          );
        } else {
          return (
            <TableViewerPanel
              key={panel.table.id}
              tableMetadata={panel.table}
              hidden={panel.id !== selectedPanelId}
            />
          );
        }
      }
      case "diff": {
        return (
          <TableDiffViewerPanel
            diffDescription={panel.diff}
            hidden={panel.id !== selectedPanelId}
          />
        );
      }
      case "review_current_version": {
        return <ReviewPanel />;
      }
    }
  };

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
                  materialSymbol={getPanelSymbol(panel)}
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
                {renderPanel(panel)}
              </TabPanel>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
