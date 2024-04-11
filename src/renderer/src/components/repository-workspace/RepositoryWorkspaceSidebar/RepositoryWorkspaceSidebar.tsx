import { MaterialSymbolButton } from "gittable-editor";
import "./RepositoryWorkspaceSidebar.css";
import { appActions } from "@renderer/store/appSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, AppRootState } from "@renderer/store/store";
import { RepositoryContent } from "../RepositoryContent";
import { VersionsSection } from "../VersionsSection";

export function RepositoryWorkspaceSidebar(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  //#region Selectors
  const repository = useSelector(
    (state: AppRootState) => state.repo.repository!,
  )!;

  //#endregion

  return (
    <div className="repository-workspace-sidebar">
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
        <RepositoryContent />
      </div>
    </div>
  );
}
