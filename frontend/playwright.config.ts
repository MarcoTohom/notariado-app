import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:5174",
    browserName: "chromium",
    headless: true,
    actionTimeout: 10000,
  },
  webServer: [
    {
      command: '".venv\\Scripts\\python.exe" tests/e2e_server.py',
      cwd: "../backend",
      url: "http://127.0.0.1:8011/api/v1/health",
      reuseExistingServer: false,
      timeout: 60000,
    },
    {
      command: "npm run dev -- --port 5174 --strictPort",
      env: { VITE_API_PROXY: "http://127.0.0.1:8011" },
      url: "http://127.0.0.1:5174",
      reuseExistingServer: false,
      timeout: 60000,
    },
  ],
});
