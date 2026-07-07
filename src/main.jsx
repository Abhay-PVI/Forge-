import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import Router from "./app/Router";
import { Providers } from "./app/Providers";

import "./shared/styles/globals.css";
import "./shared/styles/theme.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Providers>
        <Router />
      </Providers>
    </BrowserRouter>
  </React.StrictMode>
);
