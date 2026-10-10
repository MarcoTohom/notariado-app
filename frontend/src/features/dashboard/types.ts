export interface SystemInfo {
  version: string;
  environment: string;
  debug: boolean;
  database: string;
  timestamp: string;
}

export interface HealthResponse {
  status: "ok" | "degraded" | "down";
  app: string;
  system: SystemInfo;
  checks: {
    database: string;
    uploads_dir: boolean;
    generated_dir: boolean;
    [key: string]: any;
  };
}
