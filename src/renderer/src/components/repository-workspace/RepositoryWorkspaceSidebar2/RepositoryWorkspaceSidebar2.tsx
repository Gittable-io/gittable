import { MaterialSymbolButton } from "gittable-editor";
import "./RepositoryWorkspaceSidebar2.css";
import { appActions } from "@renderer/store/appSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, AppRootState } from "@renderer/store/store";
import { RepositoryContent2 } from "../RepositoryContent2";
import { VersionsSection } from "../VersionsSection";

export function RepositoryWorkspaceSidebar2(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  //#region Selectors
  const repository = useSelector(
    (state: AppRootState) => state.repo.repository!,
  )!;

  //#endregion

  return (
    <div className="repository-workspace-sidebar2">
      <div className="toolbar">
        <MaterialSymbolButton
          symbol="close"
          onClick={() => dispatch(appActions.closeRepository())}
        />
      </div>
      <div className="title">
        <h2>{repository.name}</h2>
      </div>
      <VersionsSection />
      <div className="content">
        <RepositoryContent2 />
      </div>
    </div>
  );
}
