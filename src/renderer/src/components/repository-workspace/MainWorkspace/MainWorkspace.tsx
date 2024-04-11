import { WorkspaceToolbar } from "../WorkspaceToolbar";
import { EditorPanelGroup } from "../editor-panel-group/EditorPanelGroup";
import "./MainWorkspace.css";

export function MainWorkspace(): JSX.Element {
  return (
    <div className="main-workspace">
      <WorkspaceToolbar />
      <EditorPanelGroup />
    </div>
  );
}
