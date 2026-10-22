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
import "./intelligence.css";
import "./tours.css";
import App from "./App";
import { Store } from "./store";
import { Tours } from "./components/Tours";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Store>
      <Tours>
        <App />
      </Tours>
    </Store>
  </React.StrictMode>,
);
