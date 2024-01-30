import React from "react";
import ReactDOM from "react-dom/client";
import "./reset.css";
import App from "./App";
import AppGit from "./AppGit";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AppGit />
  </React.StrictMode>,
);
