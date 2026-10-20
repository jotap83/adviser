import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import "./styles.css";
import "./briefing-workspace.css";
import "./quote-workspace.css";
import "./inbox-workspace.css";
import "./production-workspace.css";
import "./organization.css";
import App from "./App";
import { Store } from "./store";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Store>
      <App />
    </Store>
  </React.StrictMode>,
);
