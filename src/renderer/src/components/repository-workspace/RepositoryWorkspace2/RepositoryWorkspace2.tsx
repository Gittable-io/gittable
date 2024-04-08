import { AppDispatch, AppRootState } from "@renderer/store/store";
import "./RepositoryWorkspace2.css";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { repoActions } from "@renderer/store/repoSlice";
import { RepositoryWorkspaceSidebar2 } from "../RepositoryWorkspaceSidebar2";
import { EditorPanelGroup2 } from "../editor-panel-group/EditorPanelGroup2";

export function RepositoryWorkspace2(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  const repository = useSelector(
    (state: AppRootState) => state.repo.repository!,
  )!;

  useEffect(() => {
    const initWorkspace = async (): Promise<void> => {
      // Fetch versions
      const versionsResponse = await window.api.list_versions({
        repositoryId: repository.id,
      });

      if (versionsResponse.status === "success") {
        // Get current version
        const currentVersion = versionsResponse.versions.find(
          (v) => v.current,
        )!;

        dispatch(
          repoActions.setVersions({
            versions: versionsResponse.versions,
            checkedOutVersion: currentVersion,
          }),
        );
      } else {
        console.error(
          "[RepositoryWorkspace/initState] Couldn't retrieve versions",
        );
        return;
      }

      // Get version content
      const contentResponse = await window.api.get_checked_out_content({
        repositoryId: repository.id,
      });
      if (contentResponse.status === "success") {
        dispatch(repoActions.completeCheckout(contentResponse.content));
      } else {
        console.error(
          "[RepositoryWorkspace/initState] Couldn't retrieve version content",
        );
        return;
      }
    };

    initWorkspace();
  }, [dispatch, repository.id]);

  return (
    <div className="repository-workspace2">
      <RepositoryWorkspaceSidebar2 />
      <EditorPanelGroup2 />
    </div>
  );
}
