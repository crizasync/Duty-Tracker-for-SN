import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import App from "./App";
import AuthProvider from "./context/AuthContext";
import ThemeProvider from "./context/ThemeProvider";
import DutySync from "./components/DutySync";
import PwaStatus from "./components/PwaStatus";

import "./index.css";
import "./mobile.css";
import "./geomap.css";
import "./desktop.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <DutySync />
          <PwaStatus />
          <App />
          <Toaster position="top-right" />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
