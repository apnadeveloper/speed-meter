
import { GoogleGenAI, Type } from "@google/genai";
import { PageSpeedResult, GeminiAnalysis } from "../types";

// Initialize Gemini Client using the environment variable directly as per SDK guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzePerformance = async (url: string, result: PageSpeedResult): Promise<GeminiAnalysis> => {
  try {
    const cats = result.categories;
    // Optimized prompt for speed and conciseness
    const prompt = `
      Analyze Lighthouse metrics for ${url}:
      
      Scores:
      - Performance: ${cats?.performance ?? result.overallScore}/100
      - Accessibility: ${cats?.accessibility ?? 'N/A'}/100
      - Best Practices: ${cats?.bestPractices ?? 'N/A'}/100
      - SEO: ${cats?.seo ?? 'N/A'}/100

      Core Web Vitals:
      - FCP: ${result.metrics.fcp.displayValue}
      - LCP: ${result.metrics.lcp.displayValue}
      - CLS: ${result.metrics.cls.displayValue}
      - TBT: ${result.metrics.tbt.displayValue}
      - SI: ${result.metrics.si.displayValue}

      Provide:
      1. Brief summary (max 2 sentences) of main bottlenecks across all categories.
      2. 3 specific, short actionable technical fixes.
      3. Priority.
    `;

    // Using gemini-3-flash-preview for text analysis tasks as per guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "Brief summary of bottlenecks." },
            recommendations: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "3 short technical fixes."
            },
            priority: { 
              type: Type.STRING, 
              enum: ["high", "medium", "low"],
              description: "Fix urgency."
            }
          },
          required: ["summary", "recommendations", "priority"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text) as GeminiAnalysis;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      summary: "Unable to generate AI analysis at this time. Please check your API key and try again.",
      recommendations: ["Check manual PageSpeed Insights report.", "Review server response times.", "Optimize images manually."],
      priority: "medium"
    };
  }
};

export const getMetricExplanation = async (metricName: string, value: string, score: number): Promise<string> => {
  try {
    const prompt = `
      The user's website has a ${metricName} of ${value} (Score: ${Math.round(score * 100)}/100).
      
      1. Briefly explain what ${metricName} measures in plain english (1 sentence).
      2. Explain why this specific score/value is considered ${score >= 0.9 ? 'good' : score >= 0.5 ? 'needs improvement' : 'poor'}.
      3. Provide 3 specific technical solutions to improve this specific metric.
      
      Keep it professional, concise, and formatted in Markdown.
    `;

    // Using gemini-3-flash-preview for optimal latency on explanation tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Unable to generate explanation.";
  } catch (error) {
    console.error("Gemini Metric Explanation Error:", error);
    return "Unable to generate explanation at this time.";
  }
};
