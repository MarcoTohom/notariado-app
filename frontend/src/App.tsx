import React from "react";
import { AppProviders } from "./app/AppProviders";
import { AppRoutes } from "./app/AppRoutes";

export const App: React.FC = () => (
  <AppProviders>
    <AppRoutes />
  </AppProviders>
);
