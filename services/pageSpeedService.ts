import { PageSpeedResult, Metric } from '../types';

const PSI_API_ENDPOINT = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

export const runPageSpeedCheck = async (url: string, device: 'mobile' | 'desktop' = 'desktop', signal?: AbortSignal): Promise<PageSpeedResult> => {
  try {
    const params = new URLSearchParams();
    params.append('url', url);
    params.append('strategy', device);
    params.append('category', 'PERFORMANCE');
    params.append('category', 'ACCESSIBILITY');
    params.append('category', 'BEST_PRACTICES');
    params.append('category', 'SEO');

    // Check for a user-provided PageSpeed API key in localStorage
    const storedKey = localStorage.getItem('psi_api_key');
    if (storedKey) {
      params.append('key', storedKey);
    }

    const response = await fetch(`${PSI_API_ENDPOINT}?${params.toString()}`, { signal });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // Enhance error message for common quota issues
      let errorMessage = errorData?.error?.message || `Failed to fetch PageSpeed data: ${response.statusText}`;
      
      if (response.status === 429 || errorMessage.toLowerCase().includes('quota')) {
        errorMessage = "Daily quota exceeded. Please add a free PageSpeed API Key in Settings to continue.";
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    const lighthouse = data.lighthouseResult;
    const audits = lighthouse.audits;
    const categories = lighthouse.categories;

    const extractMetric = (auditKey: string): Metric => ({
      title: audits[auditKey].title,
      displayValue: audits[auditKey].displayValue,
      score: audits[auditKey].score,
      numericValue: audits[auditKey].numericValue,
      description: audits[auditKey].description,
    });

    const performanceScore = Math.round((categories.performance?.score || 0) * 100);

    const result: PageSpeedResult = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      overallScore: performanceScore,
      categories: {
        performance: performanceScore,
        accessibility: Math.round((categories.accessibility?.score || 0) * 100),
        bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
        seo: Math.round((categories.seo?.score || 0) * 100),
      },
      metrics: {
        fcp: extractMetric('first-contentful-paint'),
        lcp: extractMetric('largest-contentful-paint'),
        cls: extractMetric('cumulative-layout-shift'),
        tbt: extractMetric('total-blocking-time'),
        si: extractMetric('speed-index'),
      },
      screenshot: audits['final-screenshot']?.details?.data,
    };

    return result;
  } catch (error) {
    // Re-throw if it's an abort error so the UI handles it correctly
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    console.error("PageSpeed API Error:", error);
    throw error;
  }
};