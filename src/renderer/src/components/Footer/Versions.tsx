import { useState } from "react";
import { version as gittableVersion } from "gittable-editor";
import "./Versions.css";

function Versions(): JSX.Element {
  const [versions] = useState(window.electron.process.versions);

  return (
    <ul className="versions">
      <li className="electron-version">Electron v{versions.electron}</li>
      <li className="chrome-version">Chromium v{versions.chrome}</li>
      <li className="node-version">Node v{versions.node}</li>
      <li className="v8-version">V8 v{versions.v8}</li>
      <li className="gittable-editor">gittable-editor v{gittableVersion}</li>
    </ul>
  );
}

export default Versions;
