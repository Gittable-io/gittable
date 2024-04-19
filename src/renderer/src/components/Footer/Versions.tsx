import { useState } from "react";
import { version as gittableVersion } from "gittable-editor";
import "./Versions.css";
import { useSelector } from "react-redux";
import { AppRootState } from "@renderer/store/store";

function Versions(): JSX.Element {
  const [versions] = useState(window.electron.process.versions);

  const userGitConfig = useSelector(
    (state: AppRootState) => state.app.gitConfig.user,
  );

  return (
    <ul className="versions">
      <li className="electron-version">Electron v{versions.electron}</li>
      <li className="chrome-version">Chromium v{versions.chrome}</li>
      <li className="node-version">Node v{versions.node}</li>
      <li className="gittable-editor">gittable-editor v{gittableVersion}</li>
      <li>User: {userGitConfig.name}</li>
    </ul>
  );
}

export default Versions;
