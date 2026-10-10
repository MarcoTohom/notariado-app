import type { CaseType } from "../../shared/types";

export type ExperimentMethod = "TRADITIONAL" | "SYSTEM";

export type ExperimentStage = "DETECCION" | "CORRECCION" | "GENERACION";

export interface ExperimentTestCase {
  id: string;
  case_id: string;
  template_version_id: string;
  case_type: CaseType;
  title: string;
  has_anomalies: boolean;
  anomaly_types: string[];
  expected_findings: string[];
  created_at: string;
}

export interface ExperimentTestCaseListResponse {
  total: number;
  items: ExperimentTestCase[];
}

export interface CorpusGenerationResult {
  distribution: Record<string, { total: number; clean: number; anomalous: number }>;
  total: number;
  anomalous: number;
}

export interface ExperimentExecution {
  id: string;
  test_case_id: string;
  method: ExperimentMethod;
  started_at: string;
  finished_at?: string | null;
  duration_seconds?: number | null;
  duration_minutes?: string | null;
  errors_found: number;
  errors_missed: number;
  corrections: number;
  notes?: string | null;
  executed_by_id: string;
  created_at: string;
}

export interface ExperimentTimeMeasurement {
  id: string;
  execution_id: string;
  stage: ExperimentStage;
  started_at: string;
  finished_at?: string | null;
  duration_seconds?: number | null;
}

export interface SeriesStats {
  n: number;
  mean_seconds: number | null;
  std_seconds: number | null;
  ci95_seconds: number | null;
  mean_minutes: number | null;
  errors_found: number;
  errors_missed: number;
  normality: { W: number; p_value: number; normal: boolean } | null;
}

export interface ExperimentStats {
  baseline_minutes: number;
  baseline_source: "HISTORICA" | "MEDICIONES";
  traditional: SeriesStats;
  system: SeriesStats;
  traditional_mean_minutes_used: number;
  reduction_percentage: number | null;
  paired_test: {
    test: "t_student_pareada" | "wilcoxon";
    pairs: number;
    statistic: number;
    p_value: number;
    alpha: number;
    significant: boolean;
  } | null;
  cases_total: number;
  cases_with_anomalies: number;
  executions_total: number;
}
