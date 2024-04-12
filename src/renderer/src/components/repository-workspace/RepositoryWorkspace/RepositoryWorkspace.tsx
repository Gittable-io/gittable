import { AppDispatch, AppRootState } from "@renderer/store/store";
import "./RepositoryWorkspace.css";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { repoActions } from "@renderer/store/repoSlice";
import { RepositoryWorkspaceSidebar } from "../RepositoryWorkspaceSidebar";
import { MainWorkspace } from "../MainWorkspace";
import { RemoteActionCredentialsInputModal } from "../RemoteActionCredentialsInputModal";
import { Spinner } from "gittable-editor";

export function RepositoryWorkspace(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  const repository = useSelector(
    (state: AppRootState) => state.repo.repository!,
  );

  const repositoryStatus = useSelector(
    (state: AppRootState) => state.repo.status,
  );

  const remoteActionSequence = useSelector(
    (state: AppRootState) => state.repo.remoteActionSequence,
  );

  useEffect(() => {
    dispatch(repoActions.fetchRepositoryDetails());
  }, [dispatch, repository.id]);

  return (
    <div className="repository-workspace">
      {repositoryStatus ? (
        <>
          {!repositoryStatus.isEmpty ? (
            <>
              <RepositoryWorkspaceSidebar />
              <MainWorkspace />
            </>
          ) : (
            <div>Repo is empty</div>
          )}
          {(remoteActionSequence?.step === "REQUESTING_CREDENTIALS" ||
            remoteActionSequence?.step === "AUTH_ERROR") && (
            <RemoteActionCredentialsInputModal />
          )}
        </>
      ) : (
        <Spinner />
      )}
    </div>
  );
}
