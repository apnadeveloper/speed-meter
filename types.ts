export interface Metric {
  title: string;
  displayValue: string;
  score: number; // 0-1 (1 is good)
  numericValue: number;
  description?: string;
}

export interface AuditItem {
  id: string;
  title: string;
  description: string;
  score: number | null;
  displayValue?: string;
}

export interface PageSpeedResult {
  id: string; // unique ID for this run
  timestamp: string;
  overallScore: number; // 0-100 (Kept for backward compatibility, same as categories.performance)
  categories: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  categoryAudits: {
    performance: AuditItem[];
    accessibility: AuditItem[];
    bestPractices: AuditItem[];
    seo: AuditItem[];
  };
  metrics: {
    fcp: Metric;
    lcp: Metric;
    cls: Metric;
    tbt: Metric;
    si: Metric;
  };
  screenshot?: string;
}

export interface StrategyData {
  status: 'idle' | 'loading' | 'error' | 'success';
  error?: string;
  lastRun?: PageSpeedResult;
  history: PageSpeedResult[];
}

export interface Site {
  id: string;
  url: string;
  // Replaced single 'device' strategy with explicit data for both
  mobile: StrategyData;
  desktop: StrategyData;
}

export interface GeminiAnalysis {
  summary: string;
  recommendations: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface ThresholdConfig {
  lcp: number; // in seconds
  cls: number; // unitless
  score: number; // 0-100
}