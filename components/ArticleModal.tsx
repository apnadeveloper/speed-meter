import React from 'react';
import { X, Sparkles, Zap, CheckCircle, BarChart2 } from './Icons';

interface ArticleModalProps {
  onClose: () => void;
}

const ArticleModal: React.FC<ArticleModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-900">About Speed Meter</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-8 prose prose-slate max-w-none">
          <h1 className="text-3xl font-bold text-slate-900 mb-6">Speed Meter: The Ultimate Bulk PageSpeed Analysis Tool</h1>
          
          <p className="text-lg text-slate-600 mb-6">
            In the modern digital landscape, milliseconds equate to millions. <strong>Speed Meter</strong> is a professional-grade web application designed for developers, SEO specialists, and digital marketers who need to monitor website performance efficiently. Leveraging the power of the Google PageSpeed Insights API and advanced AI analysis, Speed Meter provides a comprehensive solution for tracking Core Web Vitals across multiple projects simultaneously.
          </p>

          <h3 className="text-xl font-bold text-slate-800 mb-3 mt-6">Why Speed Matters</h3>
          <p className="text-slate-600 mb-4">
            Website performance is no longer just a technical metric; it is a fundamental component of User Experience (UX) and Search Engine Optimization (SEO). Google's Core Web Vitals update has made metrics like <strong>Largest Contentful Paint (LCP)</strong> and <strong>Cumulative Layout Shift (CLS)</strong> critical ranking factors. A slow website leads to higher bounce rates, lower conversion rates, and reduced visibility in search results.
          </p>

          <h3 className="text-xl font-bold text-slate-800 mb-3 mt-6">Key Benefits of Speed Meter</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><Zap className="w-4 h-4" /></div>
              <div>
                <h4 className="font-semibold text-slate-900">Bulk Monitoring</h4>
                <p className="text-sm text-slate-500">Track multiple websites at once. Switch effortlessly between Mobile and Desktop strategies without reloading.</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0"><Sparkles className="w-4 h-4" /></div>
              <div>
                <h4 className="font-semibold text-slate-900">AI-Powered Insights</h4>
                <p className="text-sm text-slate-500">Integrated with Google Gemini to translate complex metrics into actionable, technical action plans.</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><BarChart2 className="w-4 h-4" /></div>
              <div>
                <h4 className="font-semibold text-slate-900">Historical Tracking</h4>
                <p className="text-sm text-slate-500">Visualize progress over time with interactive charts. See how your optimization efforts impact scores.</p>
              </div>
            </div>
             <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0"><CheckCircle className="w-4 h-4" /></div>
              <div>
                <h4 className="font-semibold text-slate-900">Performance Thresholds</h4>
                <p className="text-sm text-slate-500">Set custom alerts (e.g., LCP &lt; 2.5s). Receive notifications instantly if a site falls below standards.</p>
              </div>
            </div>
          </div>

          <h3 className="text-xl font-bold text-slate-800 mb-3 mt-6">How to Use Speed Meter</h3>
          <ol className="list-decimal pl-5 space-y-2 text-slate-700 mb-6">
            <li><strong>Add a Website:</strong> Click the "Add Site" button and enter your URL. The tool automatically validates the format.</li>
            <li><strong>Run Analysis:</strong> Speed Meter initiates a dual-strategy audit (Mobile & Desktop) via the Google PageSpeed API.</li>
            <li><strong>Review Metrics:</strong> Instantly view your overall Performance Score, LCP, CLS, and TBT. Click on any metric for a detailed AI explanation.</li>
            <li><strong>Generate Reports:</strong> Use the "Export PDF" feature to create professional, branded reports for clients or stakeholders.</li>
            <li><strong>Configure Alerts:</strong> Go to Settings to define your performance thresholds. Speed Meter will notify you if a site underperforms.</li>
          </ol>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-8 text-center">
            <p className="text-sm text-slate-500 mb-2">Developed with precision and care.</p>
            <p className="font-medium text-slate-900">Start optimizing your digital presence today with Speed Meter.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleModal;