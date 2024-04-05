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
    const initState = async (): Promise<void> => {
      // Fetch versions
      const response = await window.api.get_versions({
        repositoryId: repository.id,
      });

      if (response.status === "success") {
        dispatch(repoActions.setVersions(response.versions));
      } else {
        console.error(
          "[RepositoryWorkspace/initState] Couldn't retrieve versions",
        );
      }
    };

    initState();
  }, [dispatch, repository.id]);

  return (
    <div className="repository-workspace2">
      <RepositoryWorkspaceSidebar2 />
    </div>
  );
}
