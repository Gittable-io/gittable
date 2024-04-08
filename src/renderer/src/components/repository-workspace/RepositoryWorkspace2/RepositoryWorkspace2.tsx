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
    dispatch(repoActions.fetchRepositoryDetails());
  }, [dispatch, repository.id]);

  return (
    <div className="repository-workspace2">
      <RepositoryWorkspaceSidebar2 />
      <EditorPanelGroup2 />
    </div>
  );
}
