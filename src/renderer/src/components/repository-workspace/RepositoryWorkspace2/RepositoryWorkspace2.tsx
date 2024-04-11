import { AppDispatch, AppRootState } from "@renderer/store/store";
import "./RepositoryWorkspace2.css";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { repoActions } from "@renderer/store/repoSlice";
import { RepositoryWorkspaceSidebar2 } from "../RepositoryWorkspaceSidebar2";
import { MainWorkspace } from "../MainWorkspace";
import { RemoteActionCredentialsInputModal } from "../source-control/RemoteActionCredentialsInputModal";

export function RepositoryWorkspace2(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  const repository = useSelector(
    (state: AppRootState) => state.repo.repository!,
  )!;

  const remoteActionSequence = useSelector(
    (state: AppRootState) => state.repo.remoteActionSequence,
  );

  useEffect(() => {
    dispatch(repoActions.fetchRepositoryDetails());
  }, [dispatch, repository.id]);

  return (
    <div className="repository-workspace2">
      <RepositoryWorkspaceSidebar2 />
      <MainWorkspace />
      {(remoteActionSequence?.step === "REQUESTING_CREDENTIALS" ||
        remoteActionSequence?.step === "AUTH_ERROR") && (
        <RemoteActionCredentialsInputModal />
      )}
    </div>
  );
}
