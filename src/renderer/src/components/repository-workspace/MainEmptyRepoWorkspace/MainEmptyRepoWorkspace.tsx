import { Button } from "gittable-editor";
import "./MainEmptyRepoWorkspace.css";

export function MainEmptyRepoWorkspace(): JSX.Element {
  return (
    <div className="main-empty-repo-workspace">
      <div className="required-action">
        <h3>One more step to setup your workspace</h3>
        <p>
          It seems that you opened an empty workspace that yout Git or IT
          administrator just created on the server.
          <br />
          You need one more step to initalize the workspace to be usable by your
          team.
          <Button
            text="Initialize repository"
            variant="outlined"
            onClick={() => {}}
          />
        </p>
      </div>
    </div>
  );
}
