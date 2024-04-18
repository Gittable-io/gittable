import { Button } from "gittable-editor";
import "./MainUninitializedRepoWorkspace.css";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, AppRootState } from "@renderer/store/store";
import { repoActions } from "@renderer/store/repoSlice";

export function MainUninitializedRepoWorkspace(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  const isInitRepoInProgress: boolean = useSelector(
    (state: AppRootState) =>
      state.repo.remoteActionSequence?.action.type === "INIT_REPO",
  );

  return (
    <div className="main-uninitialized-repo-workspace">
      <div className="required-action">
        <h3>One more step to setup your workspace</h3>
        <p>
          It seems that you opened an empty workspace that yout Git or IT
          administrator just created on the server.
          <br />
          <br />
          You need one more step to initalize the workspace to be usable by your
          team.
          <br />
          <br />
          <Button
            text="Initialize repository"
            variant="outlined"
            onClick={() =>
              dispatch(
                repoActions.remoteAction({
                  action: { type: "INIT_REPO" },
                }),
              )
            }
            loading={isInitRepoInProgress}
          />
        </p>
      </div>
    </div>
  );
}
