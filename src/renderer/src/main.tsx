import React from "react";
import ReactDOM from "react-dom/client";
import "./reset.css";
import "./css-variables.css";
import { App } from "./components/App";
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
