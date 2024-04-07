import { AppDispatch, AppRootState } from "@renderer/store/store";
import "./RepositoryWorkspace2.css";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { repoActions } from "@renderer/store/repoSlice";
import { RepositoryWorkspaceSidebar2 } from "../RepositoryWorkspaceSidebar2";

export function RepositoryWorkspace2(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  const repository = useSelector(
    (state: AppRootState) => state.repo.repository!,
  )!;

  useEffect(() => {
    const initWorkspace = async (): Promise<void> => {
      // Fetch current version
      const currentVersionResponse = await window.api.current_version({
        repositoryId: repository.id,
      });

      if (currentVersionResponse.status === "success") {
        dispatch(repoActions.checkoutVersion(currentVersionResponse.version));
      } else {
        console.error(
          "[RepositoryWorkspace/initState] Couldn't retrieve current version",
        );
        return;
      }

      // Fetch versions
      const versionsResponse = await window.api.list_versions({
        repositoryId: repository.id,
      });

      if (versionsResponse.status === "success") {
        dispatch(repoActions.setVersions(versionsResponse.versions));
      } else {
        console.error(
          "[RepositoryWorkspace/initState] Couldn't retrieve versions",
        );
        return;
      }
    };

    initWorkspace();
  }, [dispatch, repository.id]);

  return (
    <div className="repository-workspace2">
      <RepositoryWorkspaceSidebar2 />
    </div>
  );
}
