import { WorkspaceToolbar } from "../WorkspaceToolbar";
import { EditorPanelGroup2 } from "../editor-panel-group/EditorPanelGroup2";
import "./MainWorkspace.css";

export function MainWorkspace(): JSX.Element {
  return (
    <div className="main-workspace">
      <WorkspaceToolbar />
      <EditorPanelGroup2 />
    </div>
  );
}
