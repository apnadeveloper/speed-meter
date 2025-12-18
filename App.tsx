import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  RefreshCw, 
  Globe, 
  Smartphone, 
  Monitor, 
  Trash2, 
  Zap, 
  Activity, 
  ChevronRight, 
  CheckCircle,
  X,
  ArrowUpRight,
  Clock,
  BarChart2, 
  Square,
  Download,
  AlertTriangle,
  Sun,
  Moon,
  Sparkles
} from './components/Icons';
import { Site, PageSpeedResult, StrategyData, Metric, ThresholdConfig, AuditItem } from './types';
import { runPageSpeedCheck } from './services/pageSpeedService';
import { generatePDF } from './services/pdfService';
import { getMetricExplanation } from './services/geminiService';
import HistoryChart from './components/HistoryChart';
import ArticleModal from './components/ArticleModal';

// --- Helper Components ---

const ScoreBadge: React.FC<{ score: number; size?: 'sm' | 'md' | 'lg' }> = ({ score, size = 'md' }) => {
  let colorClass = 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400';
  if (score >= 90) colorClass = 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400';
  else if (score >= 50) colorClass = 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400';

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-20 h-20 text-2xl font-bold',
  };

  return (
    <div className={`rounded-full flex items-center justify-center border-2 ${colorClass} ${sizeClasses[size]} font-medium`}>
      {score}
    </div>
  );
};

const CategoryScore: React.FC<{ label: string; score: number }> = ({ label, score }) => {
  const radius = 30;
  const stroke = 5;
  const normalizedScore = Math.max(0, Math.min(score, 100));
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  let color = '#ef4444'; 
  if (score >= 90) color = '#10b981'; 
  else if (score >= 50) color = '#f59e0b';

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center">
        <svg height={radius * 2 + stroke * 2} width={radius * 2 + stroke * 2} className="rotate-[-90deg]">
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={stroke}
            r={radius}
            cx={radius + stroke}
            cy={radius + stroke}
            className="text-slate-200 dark:text-slate-800"
          />
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
            strokeLinecap="round"
            r={radius}
            cx={radius + stroke}
            cy={radius + stroke}
          />
        </svg>
        <span className={`absolute text-xl font-bold`} style={{ color }}>{score}</span>
      </div>
      <span className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-400">{label}</span>
    </div>
  );
};

const MetricCard: React.FC<{ 
  metric?: Metric; 
  onClick: () => void;
  isLoading?: boolean;
}> = ({ metric, onClick, isLoading }) => {
  if (isLoading || !metric) {
    return (
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-100 dark:border-zinc-800 shadow-sm animate-pulse">
        <div className="h-3 w-24 bg-slate-200 dark:bg-zinc-800 rounded mb-3"></div>
        <div className="flex justify-between items-end">
          <div className="h-6 w-16 bg-slate-200 dark:bg-zinc-800 rounded"></div>
          <div className="h-3 w-3 rounded-full bg-slate-200 dark:bg-zinc-800"></div>
        </div>
      </div>
    );
  }

  let indicator = 'bg-red-500';
  if (metric.score >= 0.9) indicator = 'bg-emerald-500';
  else if (metric.score >= 0.5) indicator = 'bg-amber-500';

  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-100 dark:border-zinc-800 shadow-sm flex items-center justify-between cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-800 hover:shadow-md transition-all group"
    >
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold mb-1 flex items-center gap-1">
          {metric.title}
          <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500" />
        </p>
        <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{metric.displayValue}</p>
      </div>
      <div className={`w-3 h-3 rounded-full ${indicator}`}></div>
    </div>
  );
};

const Notification: React.FC<{ message: string; type: 'success' | 'warning'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg border flex items-center gap-3 animate-in slide-in-from-right fade-in duration-300 max-w-sm ${type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400' : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'}`}>
      {type === 'warning' ? <Activity className="w-5 h-5 shrink-0" /> : <CheckCircle className="w-5 h-5 shrink-0" />}
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="ml-auto opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
    </div>
  );
};

const AuditSnippet: React.FC<{ details: any }> = ({ details }) => {
  if (!details || !details.items || details.items.length === 0) return null;

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-px flex-1 bg-slate-200 dark:bg-zinc-800"></div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Failing Elements</span>
        <div className="h-px flex-1 bg-slate-200 dark:bg-zinc-800"></div>
      </div>
      <div className="space-y-3">
        {details.items.slice(0, 5).map((item: any, idx: number) => {
          const node = item.node;
          if (!node) return null;
          return (
            <div key={idx} className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden flex flex-col">
              <div className="px-3 py-1.5 bg-slate-100 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center">
                <span className="text-[10px] font-mono text-indigo-700 dark:text-indigo-400 truncate max-w-[80%]">{node.selector}</span>
                {item.explanation && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-100 dark:border-amber-800">
                    {item.explanation}
                  </span>
                )}
              </div>
              <div className="p-3 space-y-2">
                {node.nodeLabel && (
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-0.5">Visible Content</span>
                    <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">{node.nodeLabel}</p>
                  </div>
                )}
                <div>
                   <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-0.5">HTML Snippet</span>
                   <code className="text-[11px] text-pink-600 dark:text-pink-400 block whitespace-pre-wrap break-all bg-white dark:bg-zinc-900 p-2 rounded border border-slate-200 dark:border-zinc-800 font-mono leading-relaxed">
                    {node.snippet || 'No snippet available'}
                  </code>
                </div>
              </div>
            </div>
          );
        })}
        {details.items.length > 5 && (
          <p className="text-[10px] text-slate-400 text-center font-medium italic pb-1">...and {details.items.length - 5} more elements need improvement</p>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('speedmonitor_theme');
    if (saved) return saved as 'light' | 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem('speedmonitor_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const [sites, setSites] = useState<Site[]>(() => {
    const saved = localStorage.getItem('speedmonitor_sites');
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return parsed.map((s: any) => {
      const migrateRun = (run: any) => {
        if (!run) return run;
        if (!run.categories) {
          return {
            ...run,
            categories: { performance: run.overallScore || 0, accessibility: 0, bestPractices: 0, seo: 0 },
            categoryAudits: { performance: [], accessibility: [], bestPractices: [], seo: [] }
          };
        }
        return run;
      };
      let mobileData = s.mobile;
      let desktopData = s.desktop;
      if (!mobileData || !desktopData) {
        const isMobile = s.device === 'mobile';
        const strategyData: StrategyData = { status: s.status, error: s.error, lastRun: s.lastRun, history: s.history || [] };
        mobileData = isMobile ? strategyData : { status: 'idle', history: [] };
        desktopData = !isMobile ? strategyData : { status: 'idle', history: [] };
      }
      if (mobileData.lastRun) mobileData.lastRun = migrateRun(mobileData.lastRun);
      if (desktopData.lastRun) desktopData.lastRun = migrateRun(desktopData.lastRun);
      mobileData.history = mobileData.history.map(migrateRun);
      desktopData.history = desktopData.history.map(migrateRun);
      return { id: s.id, url: s.url, mobile: mobileData, desktop: desktopData } as Site;
    });
  });
  
  const [thresholds] = useState<ThresholdConfig>(() => {
    const saved = localStorage.getItem('speedmonitor_thresholds');
    return saved ? JSON.parse(saved) : { lcp: 2.5, cls: 0.1, score: 90 };
  });

  const [view, setView] = useState<'dashboard' | 'detail'>('dashboard');
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [activeSiteTab, setActiveSiteTab] = useState<{ [key: string]: 'desktop' | 'mobile' }>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isArticleOpen, setIsArticleOpen] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null);
  const [metricExplanation, setMetricExplanation] = useState<string | null>(null);
  const [isExplanationLoading, setIsExplanationLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);

  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  useEffect(() => {
    localStorage.setItem('speedmonitor_sites', JSON.stringify(sites));
  }, [sites]);

  const addSite = (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError('');
    if (!newUrl) { setUrlError('Please enter a website URL'); return; }
    let formattedUrl = newUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) { formattedUrl = 'https://' + formattedUrl; }
    try {
      const urlObj = new URL(formattedUrl);
      if (!urlObj.hostname.includes('.')) { setUrlError('Please enter a valid domain'); return; }
    } catch (err) { setUrlError('Invalid URL format'); return; }
    const newSite: Site = { id: crypto.randomUUID(), url: formattedUrl, desktop: { status: 'idle', history: [] }, mobile: { status: 'idle', history: [] } };
    setSites([newSite, ...sites]);
    setNewUrl('');
    setIsAddModalOpen(false);
    setActiveSiteTab(prev => ({ ...prev, [newSite.id]: 'desktop' }));
    runCheck(newSite.id, formattedUrl);
  };

  const removeSite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const controller = abortControllers.current.get(id);
    if (controller) { controller.abort(); abortControllers.current.delete(id); }
    setSites(sites.filter(s => s.id !== id));
    if (selectedSiteId === id) setView('dashboard');
  };

  const runCheck = async (id: string, url: string, strategies: ('mobile' | 'desktop')[] = ['mobile', 'desktop']) => {
    const existingController = abortControllers.current.get(id);
    if (existingController) existingController.abort();
    const controller = new AbortController();
    abortControllers.current.set(id, controller);

    setSites(prev => prev.map(s => {
      if (s.id !== id) return s;
      const updated = { ...s };
      if (strategies.includes('desktop')) updated.desktop = { ...updated.desktop, status: 'loading', error: undefined };
      if (strategies.includes('mobile')) updated.mobile = { ...updated.mobile, status: 'loading', error: undefined };
      return updated;
    }));

    try {
      await Promise.all(strategies.map(async (strategy) => {
        try {
          const result = await runPageSpeedCheck(url, strategy, controller.signal);
          setSites(prev => prev.map(s => {
            if (s.id !== id) return s;
            const currentData = strategy === 'desktop' ? s.desktop : s.mobile;
            return { ...s, [strategy]: { status: 'success', lastRun: result, history: [...currentData.history, result] } };
          }));
        } catch (err: any) {
          if (err.name === 'AbortError') throw err;
          setSites(prev => prev.map(s => {
            if (s.id !== id) return s;
            return { ...s, [strategy]: { ...(strategy === 'desktop' ? s.desktop : s.mobile), status: 'error', error: err.message } };
          }));
        }
      }));
    } finally {
      abortControllers.current.delete(id);
    }
  };

  const handleMetricClick = async (metric: Metric) => {
    setSelectedMetric(metric);
    setMetricExplanation(null);
    setIsExplanationLoading(true);
    try {
      const explanation = await getMetricExplanation(metric.title, metric.displayValue, metric.score);
      setMetricExplanation(explanation);
    } catch (error) {
      setMetricExplanation("Unable to generate AI explanation.");
    } finally {
      setIsExplanationLoading(false);
    }
  };

  const toggleTab = useCallback((siteId: string, tab: 'desktop' | 'mobile', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveSiteTab(prev => ({ ...prev, [siteId]: tab }));
  }, []);

  const getActiveTab = useCallback((siteId: string) => activeSiteTab[siteId] || 'desktop', [activeSiteTab]);
  const filteredSites = useMemo(() => sites.filter(s => s.url.toLowerCase().includes(searchQuery.toLowerCase())), [sites, searchQuery]);
  const selectedSite = useMemo(() => sites.find(s => s.id === selectedSiteId), [sites, selectedSiteId]);

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm transition-colors">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search sites..." className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100 transition-colors" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={() => sites.forEach(s => runCheck(s.id, s.url))} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors">
            <RefreshCw className="w-4 h-4" /> Sync All
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-all hover:shadow-md">
            <Plus className="w-4 h-4" /> Add Site
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSites.map(site => {
          const activeTab = getActiveTab(site.id);
          const activeData = site[activeTab];
          return (
            <div key={site.id} onClick={() => { setSelectedSiteId(site.id); setView('detail'); }} className="group bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-50 dark:border-zinc-800 relative">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 shrink-0"><Globe className="w-5 h-5" /></div>
                    <div className="min-w-0 pr-6">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{new URL(site.url).hostname}</h3>
                      {activeData.lastRun && <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />{new Date(activeData.lastRun.timestamp).toLocaleDateString()}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); runCheck(site.id, site.url); }} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-400 transition-colors"><RefreshCw className="w-4 h-4" /></button>
                    <button onClick={(e) => removeSite(e, site.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="flex p-1 bg-slate-100 dark:bg-zinc-800 rounded-lg gap-1">
                  <button onClick={(e) => toggleTab(site.id, 'desktop', e)} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'desktop' ? 'bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}><Monitor className="w-3.5 h-3.5" />Desktop</button>
                  <button onClick={(e) => toggleTab(site.id, 'mobile', e)} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'mobile' ? 'bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}><Smartphone className="w-3.5 h-3.5" />Mobile</button>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-center min-h-[160px]">
                {activeData.status === 'loading' ? (
                  <div className="flex flex-col items-center justify-center gap-3"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div><p className="text-xs text-slate-500">Auditing...</p></div>
                ) : activeData.lastRun ? (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col"><span className="text-sm text-slate-500">Score</span><span className="text-3xl font-bold dark:text-slate-100">{activeData.lastRun.overallScore}</span></div>
                    <ScoreBadge score={activeData.lastRun.overallScore} />
                  </div>
                ) : <div className="text-center text-slate-400 text-sm">No data yet</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderDetail = () => {
    if (!selectedSite) return null;
    const activeTab = getActiveTab(selectedSite.id);
    const activeData = selectedSite[activeTab];
    const isLoading = activeData.status === 'loading';

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 transition-colors">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('dashboard')} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-colors"><ChevronRight className="w-5 h-5 rotate-180" /></button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{new URL(selectedSite.url).hostname}</h1>
              <a href={selectedSite.url} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">{selectedSite.url}<ArrowUpRight className="w-3 h-3" /></a>
            </div>
          </div>
          <div className="flex gap-2">
             <div className="flex bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-1">
                <button onClick={() => toggleTab(selectedSite.id, 'desktop')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'desktop' ? 'bg-slate-100 dark:bg-zinc-700 text-indigo-700' : 'text-slate-500'}`}>Desktop</button>
                <button onClick={() => toggleTab(selectedSite.id, 'mobile')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'mobile' ? 'bg-slate-100 dark:bg-zinc-700 text-indigo-700' : 'text-slate-500'}`}>Mobile</button>
             </div>
             <button onClick={() => runCheck(selectedSite.id, selectedSite.url, [activeTab])} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">{isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Run Audit</button>
          </div>
        </div>

        {activeData.lastRun && (
          <>
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm transition-colors">
                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-6">Audits Summary</h3>
                <div className="flex flex-wrap justify-around items-center gap-6">
                    <CategoryScore label="Performance" score={activeData.lastRun.categories.performance} />
                    <CategoryScore label="Accessibility" score={activeData.lastRun.categories.accessibility} />
                    <CategoryScore label="Best Practices" score={activeData.lastRun.categories.bestPractices} />
                    <CategoryScore label="SEO" score={activeData.lastRun.categories.seo} />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricCard metric={activeData.lastRun.metrics.fcp} onClick={() => handleMetricClick(activeData.lastRun!.metrics.fcp)} isLoading={isLoading} />
              <MetricCard metric={activeData.lastRun.metrics.lcp} onClick={() => handleMetricClick(activeData.lastRun!.metrics.lcp)} isLoading={isLoading} />
              <MetricCard metric={activeData.lastRun.metrics.cls} onClick={() => handleMetricClick(activeData.lastRun!.metrics.cls)} isLoading={isLoading} />
              <MetricCard metric={activeData.lastRun.metrics.tbt} onClick={() => handleMetricClick(activeData.lastRun!.metrics.tbt)} isLoading={isLoading} />
              <MetricCard metric={activeData.lastRun.metrics.si} onClick={() => handleMetricClick(activeData.lastRun!.metrics.si)} isLoading={isLoading} />
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-100 dark:border-zinc-800 shadow-sm flex flex-col items-center justify-center text-slate-400 border-dashed text-center">
                <span className="text-[10px] font-bold uppercase tracking-widest leading-tight">Click Metrics for AI Insights</span>
                <Sparkles className="w-3 h-3 text-indigo-400 mt-1" />
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mt-8">
                <AlertTriangle className="w-5 h-5 text-amber-500" /> Improvement Areas
              </h3>
              {['performance', 'accessibility', 'bestPractices', 'seo'].map(cat => {
                const audits = (activeData.lastRun?.categoryAudits as any)[cat] || [];
                if (audits.length === 0) return null;
                return (
                  <div key={cat} className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm transition-colors">
                    <div className="px-5 py-3 border-b border-slate-50 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/50 font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-widest">{cat}</div>
                    <div className="divide-y dark:divide-zinc-800">
                      {audits.map((audit: AuditItem) => (
                        <div key={audit.id} className="p-5 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{audit.title}</h4>
                            {audit.displayValue && <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded">{audit.displayValue}</span>}
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: audit.description.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-indigo-600 font-bold">$1</a>') }} />
                          <AuditSnippet details={audit.details} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 flex flex-col">
      <nav className="sticky top-0 z-30 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white"><Zap className="w-5 h-5 fill-current" /></div>
            <span className="font-bold text-xl tracking-tight">Speed <span className="text-indigo-600">Meter</span></span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsArticleOpen(true)} className="text-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 font-black uppercase tracking-widest px-4 py-2 transition-all">About Tools</button>
            <button onClick={toggleTheme} className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-all">
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full">{view === 'dashboard' ? renderDashboard() : renderDetail()}</main>
      <footer className="bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 py-8"><div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-500">&copy; 2025 Speed Meter &bull; Developed by Noor Muhammad</div></footer>
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border dark:border-zinc-800">
            <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center"><h2 className="text-lg font-bold">Add New Website</h2><button onClick={() => setIsAddModalOpen(false)}><X className="w-5 h-5" /></button></div>
            <form onSubmit={addSite} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium mb-1">URL</label><input type="text" autoFocus placeholder="example.com" className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-zinc-950 dark:text-white ${urlError ? 'border-red-500' : 'border-slate-300 dark:border-zinc-700'}`} value={newUrl} onChange={(e) => setNewUrl(e.target.value)} />{urlError && <p className="text-xs text-red-500 mt-1">{urlError}</p>}</div>
              <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold uppercase tracking-wider text-sm transition-colors">Start Analysis</button>
            </form>
          </div>
        </div>
      )}
      {isArticleOpen && <ArticleModal onClose={() => setIsArticleOpen(false)} />}
      {selectedMetric && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border dark:border-zinc-800">
               <div className="p-6 border-b dark:border-zinc-800 flex justify-between items-center"><div className="flex items-center gap-3"><h2 className="text-xl font-bold">{selectedMetric.title}</h2><ScoreBadge score={Math.round(selectedMetric.score * 100)} size="sm" /></div><button onClick={() => { setSelectedMetric(null); setMetricExplanation(null); }}><X className="w-6 h-6" /></button></div>
               <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                  {isExplanationLoading ? (
                    <div className="space-y-4 py-4"><div className="flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase"><Sparkles className="w-4 h-4 animate-spin" /> Gemini AI Analyzing...</div><div className="h-4 w-full bg-slate-100 dark:bg-zinc-800 rounded animate-pulse"></div><div className="h-4 w-3/4 bg-slate-100 dark:bg-zinc-800 rounded animate-pulse"></div></div>
                  ) : metricExplanation ? (
                    <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30" dangerouslySetInnerHTML={{ __html: metricExplanation }} />
                  ) : <div className="text-sm text-slate-500">{selectedMetric.description}</div>}
               </div>
            </div>
         </div>
      )}
    </div>
  );
}