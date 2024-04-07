import { MaterialSymbolButton } from "gittable-editor";
import "./RepositoryWorkspaceSidebar2.css";
import { appActions } from "@renderer/store/appSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, AppRootState } from "@renderer/store/store";
import { VersionSelector } from "../VersionSelector";
import { repoActions } from "@renderer/store/repoSlice";

export function RepositoryWorkspaceSidebar2(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  const repository = useSelector(
    (state: AppRootState) => state.repo.repository!,
  )!;
  const versions = useSelector((state: AppRootState) => state.repo.versions);
  const checkedOutVersion = useSelector(
    (state: AppRootState) => state.repo.checkedOutVersion!,
  );

  const checkOutVersion = async (version: string): Promise<void> => {
    dispatch(repoActions.checkoutVersion(version));
  };

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
      <div className="content">
        <VersionSelector
          versions={versions}
          selectedVersion={checkedOutVersion}
          onVersionChange={checkOutVersion}
        />
      </div>
    </div>
  );
}
