import { MaterialSymbolButton } from "gittable-editor";
import "./RepositoryWorkspaceSidebar2.css";
import { appActions } from "@renderer/store/appSlice";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@renderer/store/store";

export function RepositoryWorkspaceSidebar2(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  return (
    <div className="repository-workspace-sidebar2">
      <div className="toolbar">
        <MaterialSymbolButton
          symbol="close"
          onClick={() => dispatch(appActions.closeRepository())}
        />
      </div>
    </div>
  );
}
