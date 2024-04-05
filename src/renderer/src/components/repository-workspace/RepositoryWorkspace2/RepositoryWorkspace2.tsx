import { AppDispatch, AppRootState } from "@renderer/store/store";
import "./RepositoryWorkspace2";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { repoActions } from "@renderer/store/repoSlice";

export function RepositoryWorkspace2(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  const repository = useSelector(
    (state: AppRootState) => state.repo.repository!,
  )!;

  const versions = useSelector((state: AppRootState) => state.repo.versions)!;

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
      <div>{`RepositoryWorkspace2 : ${repository.name}`}</div>
      <div>
        {versions.map((version) => (
          <div key={version}>{version}</div>
        ))}
      </div>
    </div>
  );
}
