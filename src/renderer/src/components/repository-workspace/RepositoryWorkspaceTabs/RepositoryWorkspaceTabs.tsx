import { TableMetadata } from "@sharedTypes/index";
import "./RepositoryWorkspaceTabs.css";
import { IconAndText, MaterialSymbol } from "gittable-editor";
import { TabPanel } from "react-headless-tabs";
import { TableWorkspace } from "../TableWorkspace";

export type RepositoryWorkspaceTabsProps = {
  repositoryId: string;
  openedTables: TableMetadata[];
  selectedTableId: string | null;
  onSelectTab: (tableId: string) => void;
  onCloseTab: (tableId: string) => void;
};

export function RepositoryWorkspaceTabs({
  repositoryId,
  openedTables,
  selectedTableId,
  onSelectTab,
  onCloseTab,
}: RepositoryWorkspaceTabsProps): JSX.Element {
  return (
    <div className="repository-workspace-tabs">
      {openedTables.length > 0 && (
        <>
          <div className="tab-list" role="tablist">
            {openedTables.map((table) => (
              <div
                key={table.id}
                role="tab"
                className={`tab-label ${table.id === selectedTableId ? "selected" : ""}`}
                data-tab-name={table.name}
                onClick={() => onSelectTab(table.id)}
              >
                <IconAndText text={table.name} materialSymbol="table" />
                <MaterialSymbol
                  symbol="close"
                  label="Close tab"
                  onClick={() => onCloseTab(table.id)}
                />
              </div>
            ))}
          </div>
          <div className="tab-panels">
            {openedTables.map((table) => (
              <TabPanel
                key={table.id}
                className="tab-panel"
                role="tabpanel"
                hidden={table.id !== selectedTableId}
                unmount="never"
              >
                <TableWorkspace
                  key={table.id}
                  repositoryId={repositoryId}
                  tableMetadata={table}
                  hidden={table.id !== selectedTableId}
                />
              </TabPanel>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
