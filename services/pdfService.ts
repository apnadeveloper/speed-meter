import { jsPDF } from "jspdf";
import { PageSpeedResult, GeminiAnalysis } from "../types";

export const generatePDF = (
  siteUrl: string, 
  mobileResult: PageSpeedResult | undefined, 
  desktopResult: PageSpeedResult | undefined, 
  analysis?: GeminiAnalysis | null
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const drawHeader = (strategy: string, result: PageSpeedResult) => {
    // --- Header Background ---
    doc.setFillColor(37, 99, 235); // Blue-600
    doc.rect(0, 0, pageWidth, 40, 'F');

    // --- Title ---
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Speed Meter Report", 20, 25);

    // --- Date ---
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(new Date(result.timestamp).toLocaleDateString(), pageWidth - 40, 25);

    // --- Site Info ---
    doc.setTextColor(51, 65, 85); // Slate-700
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(new URL(siteUrl).hostname, 20, 60);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text(siteUrl, 20, 66);
    doc.text(`Device Strategy: ${strategy}`, 20, 72);
  };

  const drawCategoryCircle = (label: string, score: number, x: number, y: number) => {
    let r = score >= 90 ? 5 : score >= 50 ? 217 : 220;
    let g = score >= 90 ? 150 : score >= 50 ? 119 : 38;
    let b = score >= 90 ? 105 : score >= 50 ? 6 : 38;

    doc.setDrawColor(r, g, b);
    doc.setLineWidth(2);
    doc.circle(x, y, 12);
    
    doc.setFontSize(14);
    doc.setTextColor(r, g, b);
    doc.setFont("helvetica", "bold");
    const scoreText = score.toString();
    const scoreTextWidth = doc.getStringUnitWidth(scoreText) * doc.getFontSize() / doc.internal.scaleFactor;
    doc.text(scoreText, x - (scoreTextWidth/2), y + 2);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    const labelWidth = doc.getStringUnitWidth(label) * doc.getFontSize() / doc.internal.scaleFactor;
    doc.text(label, x - (labelWidth/2), y + 20);
  };

  const drawScores = (result: PageSpeedResult) => {
    const startY = 65;
    // Check if we have categories, otherwise fallback to just performance
    if (result.categories) {
       // Center 4 circles
       // Width is ~210mm. Let's space them out.
       // 210 / 4 segments? ~50mm each.
       // Centers at: 50, 90, 130, 170 roughly. 
       // Adjusted for margin 20: (pageWidth - 40) / 4 space.
       
       const gap = (pageWidth - 40) / 4;
       let x = 20 + (gap / 2) + 20; // Start bit offset

       drawCategoryCircle("Performance", result.categories.performance, x, startY);
       drawCategoryCircle("Accessibility", result.categories.accessibility, x + gap, startY);
       drawCategoryCircle("Best Practices", result.categories.bestPractices, x + (gap * 2), startY);
       drawCategoryCircle("SEO", result.categories.seo, x + (gap * 3), startY);

    } else {
       // Legacy Fallback
       drawCategoryCircle("Performance", result.overallScore, pageWidth - 40, 65);
    }
  };

  const drawMetrics = (result: PageSpeedResult, startY: number) => {
    let y = startY;
    doc.setFontSize(12);
    doc.setTextColor(51, 65, 85);
    doc.setFont("helvetica", "bold");
    doc.text("Core Web Vitals & Metrics", 20, y);
    
    y += 10;
    const metrics = [
      { label: "First Contentful Paint", val: result.metrics.fcp },
      { label: "Largest Contentful Paint", val: result.metrics.lcp },
      { label: "Cumulative Layout Shift", val: result.metrics.cls },
      { label: "Total Blocking Time", val: result.metrics.tbt },
      { label: "Speed Index", val: result.metrics.si },
    ];

    metrics.forEach((m) => {
      // Label
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(m.label, 20, y);
      
      // Value
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(m.val.displayValue, 140, y);
      
      // Score Dot
      const dotColor = m.val.score >= 0.9 ? [16, 185, 129] : m.val.score >= 0.5 ? [245, 158, 11] : [239, 68, 68];
      doc.setFillColor(dotColor[0], dotColor[1], dotColor[2]);
      doc.circle(180, y - 1, 2, 'F');
      
      y += 10;
      // Separator line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.1);
      doc.line(20, y-5, pageWidth-20, y-5);
    });
    return y;
  };

  const drawAnalysis = (analysisData: GeminiAnalysis, startY: number) => {
    let y = startY;

    // --- Pre-calculate Box Height ---
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    const summaryLines = doc.splitTextToSize(analysisData.summary, pageWidth - 50);
    // Box vertical padding (10 top + 10 bottom) + Title (8) + Summary + Spacing (8)
    let boxHeight = 20 + 8 + (summaryLines.length * 5); 

    let recLines: string[][] = [];
    if (analysisData.recommendations && analysisData.recommendations.length > 0) {
      boxHeight += 8; // Spacing before recs
      boxHeight += 6; // Recs title
      analysisData.recommendations.forEach((rec, i) => {
        const lines = doc.splitTextToSize(`${i+1}. ${rec}`, pageWidth - 50);
        recLines.push(lines);
        boxHeight += (lines.length * 5);
      });
    }

    // Check for page break if box doesn't fit
    if (y + boxHeight > pageHeight - 20) {
        doc.addPage();
        y = 40;
    } else {
        y += 10; // spacing from previous content
    }

    // Draw Background Box
    doc.setFillColor(243, 244, 246); // slate-100
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(15, y, pageWidth - 30, boxHeight, 3, 3, 'FD');
    
    // Draw Content inside Box
    let textY = y + 10;

    // Title
    doc.setTextColor(79, 70, 229); // Indigo-600
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("AI Executive Summary", 25, textY);
    textY += 8;

    // Summary Text
    doc.setTextColor(51, 65, 85);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(summaryLines, 25, textY);
    textY += (summaryLines.length * 5) + 8;

    // Recommendations
    if (analysisData.recommendations && analysisData.recommendations.length > 0) {
       doc.setFont("helvetica", "bold");
       doc.setTextColor(30, 41, 59);
       doc.text("Key Recommendations:", 25, textY);
       textY += 6;
       
       doc.setFont("helvetica", "normal");
       doc.setTextColor(51, 65, 85);
       recLines.forEach((lines) => {
         doc.text(lines, 25, textY);
         textY += (lines.length * 5);
       });
    }
  };

  const drawFooter = () => {
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Generated by Speed Meter", pageWidth/2, pageHeight - 10, { align: "center" });
  };

  // --- Generate Pages ---
  
  let hasContent = false;
  let currentY = 0;

  if (mobileResult) {
    drawHeader("Mobile", mobileResult);
    drawScores(mobileResult);
    currentY = drawMetrics(mobileResult, 105); // Start metrics lower to accommodate circles
    drawFooter();
    hasContent = true;
  }

  if (desktopResult) {
    if (hasContent) doc.addPage();
    drawHeader("Desktop", desktopResult);
    drawScores(desktopResult);
    currentY = drawMetrics(desktopResult, 105);
    drawFooter();
    hasContent = true;
  }

  // --- Append AI Analysis (if available) ---
  if (analysis) {
     drawAnalysis(analysis, currentY); 
  }

  if (hasContent) {
    doc.save(`${new URL(siteUrl).hostname}-speedmeter-report.pdf`);
  }
};