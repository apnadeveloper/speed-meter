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
import HistoryChart from './components/HistoryChart';
import ArticleModal from './components/ArticleModal';

// --- Helper Components ---

const ScoreBadge: React.FC<{ score: number; size?: 'sm' | 'md' | 'lg' }> = ({ score, size = 'md' }) => {
  let colorClass = 'text-red-700 bg-red-100 border-red-200 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400';
  if (score >= 90) colorClass = 'text-emerald-700 bg-emerald-100 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400';
  else if (score >= 50) colorClass = 'text-amber-700 bg-amber-100 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400';

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-20 h-20 text-2xl font-bold',
  };

  return (
    <div className={`rounded-full flex items-center justify-center border-2 ${colorClass} ${sizeClasses[size]} font-bold`}>
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

  let color = '#dc2626'; // red-600
  if (score >= 90) color = '#059669'; // emerald-600
  else if (score >= 50) color = '#d97706'; // amber-600

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
            className="text-slate-200 dark:text-zinc-800"
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
      <span className="mt-2 text-sm font-semibold text-slate-700 dark:text-zinc-400">{label}</span>
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
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm animate-pulse">
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
      className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm flex items-center justify-between cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md transition-all group"
    >
      <div>
        <p className="text-[11px] text-slate-500 dark:text-zinc-400 uppercase tracking-widest font-bold mb-1 flex items-center gap-1">
          {metric.title}
          <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600" />
        </p>
        <p className="text-xl font-black text-slate-900 dark:text-zinc-100">{metric.displayValue}</p>
      </div>
      <div className={`w-3 h-3 rounded-full ${indicator} ring-4 ring-white dark:ring-zinc-900 shadow-sm`}></div>
    </div>
  );
};

const AuditSnippet: React.FC<{ details: any }> = ({ details }) => {
  if (!details || !details.items || details.items.length === 0) return null;

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest whitespace-nowrap">Pinpointed Issues</span>
        <div className="h-px flex-1 bg-slate-200 dark:bg-zinc-800"></div>
      </div>
      <div className="space-y-4">
        {details.items.slice(0, 5).map((item: any, idx: number) => {
          const node = item.node;
          if (!node) return null;
          return (
            <div key={idx} className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm flex flex-col transition-colors">
              <div className="px-3 py-2 bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center">
                <span className="text-[11px] font-mono text-indigo-700 dark:text-indigo-400 truncate max-w-[70%] font-bold">{node.selector}</span>
                {item.explanation && (
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
                    {item.explanation}
                  </span>
                )}
              </div>
              <div className="p-4 space-y-3">
                {node.nodeLabel && (
                  <div>
                    <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Impacted Element Content</span>
                    <p className="text-sm text-slate-900 dark:text-zinc-100 font-bold leading-relaxed">{node.nodeLabel}</p>
                  </div>
                )}
                <div>
                   <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Code Snippet</span>
                   <pre className="text-[12px] text-zinc-900 dark:text-zinc-200 block whitespace-pre-wrap break-all bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg border border-slate-200 dark:border-zinc-800 font-mono leading-relaxed">
                    <code>{node.snippet || 'No snippet available'}</code>
                  </pre>
                </div>
              </div>
            </div>
          );
        })}
        {details.items.length > 5 && (
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 text-center font-bold italic py-2">...and {details.items.length - 5} additional elements found on this page.</p>
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
    return JSON.parse(saved).map((s: any) => {
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
      if (mobileData?.lastRun) mobileData.lastRun = migrateRun(mobileData.lastRun);
      if (desktopData?.lastRun) desktopData.lastRun = migrateRun(desktopData.lastRun);
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
      new URL(formattedUrl);
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

  const handleMetricClick = (metric: Metric) => {
    // Directly show the modal with the metric info.
    // Lighthouse diagnostic details will be pulled from the selected site's results in the modal.
    setSelectedMetric(metric);
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
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm transition-colors">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Filter tracked domains..." className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:text-slate-100 transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={() => sites.forEach(s => runCheck(s.id, s.url))} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold transition-all">
            <RefreshCw className="w-4 h-4" /> Sync All
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-indigo-200 dark:shadow-none shadow-lg transition-all">
            <Plus className="w-4 h-4" /> Add Website
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSites.map(site => {
          const activeTab = getActiveTab(site.id);
          const activeData = site[activeTab];
          return (
            <div key={site.id} onClick={() => { setSelectedSiteId(site.id); setView('detail'); }} className="group bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-50 dark:border-zinc-800 relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 shrink-0 shadow-inner"><Globe className="w-5 h-5" /></div>
                    <div className="min-w-0 pr-6">
                      <h3 className="font-bold text-slate-900 dark:text-zinc-100 truncate text-base">{new URL(site.url).hostname}</h3>
                      {activeData.lastRun && <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1 mt-1"><Clock className="w-3 h-3" />Audit: {new Date(activeData.lastRun.timestamp).toLocaleDateString()}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); runCheck(site.id, site.url); }} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-400 transition-colors"><RefreshCw className="w-4 h-4" /></button>
                    <button onClick={(e) => removeSite(e, site.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="flex p-1 bg-slate-100 dark:bg-zinc-800 rounded-xl gap-1">
                  <button onClick={(e) => toggleTab(site.id, 'desktop', e)} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${activeTab === 'desktop' ? 'bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}><Monitor className="w-3.5 h-3.5" />Desktop</button>
                  <button onClick={(e) => toggleTab(site.id, 'mobile', e)} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${activeTab === 'mobile' ? 'bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}><Smartphone className="w-3.5 h-3.5" />Mobile</button>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-center min-h-[160px] bg-white dark:bg-zinc-900 transition-colors">
                {activeData.status === 'loading' ? (
                  <div className="flex flex-col items-center justify-center gap-4"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Deep Audit Running</p></div>
                ) : activeData.lastRun ? (
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Performance</span><span className="text-4xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">{activeData.lastRun.overallScore}</span></div>
                    <ScoreBadge score={activeData.lastRun.overallScore} />
                  </div>
                ) : <div className="text-center text-slate-400 font-bold text-sm italic">Analyze to see insights</div>}
              </div>
              <div className="bg-slate-50 dark:bg-zinc-800/50 py-3 px-6 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Detailed Report</span><ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" /></div>
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
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 transition-colors duration-500">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('dashboard')} className="p-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-500 dark:text-slate-400 hover:text-indigo-600 shadow-sm transition-all"><ChevronRight className="w-6 h-6 rotate-180" /></button>
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-zinc-100 tracking-tight leading-none">{new URL(selectedSite.url).hostname}</h1>
              <a href={selectedSite.url} target="_blank" rel="noreferrer" className="text-sm font-bold text-indigo-600 hover:underline flex items-center gap-1 mt-2 opacity-80">{selectedSite.url}<ArrowUpRight className="w-3 h-3" /></a>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
             <div className="flex-1 md:flex-none flex bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-1 shadow-sm">
                <button onClick={() => toggleTab(selectedSite.id, 'desktop')} className={`flex-1 md:px-5 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'desktop' ? 'bg-slate-100 dark:bg-zinc-800 text-indigo-700 dark:text-indigo-400 shadow-inner' : 'text-slate-500'}`}>Desktop</button>
                <button onClick={() => toggleTab(selectedSite.id, 'mobile')} className={`flex-1 md:px-5 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'mobile' ? 'bg-slate-100 dark:bg-zinc-800 text-indigo-700 dark:text-indigo-400 shadow-inner' : 'text-slate-500'}`}>Mobile</button>
             </div>
             <button onClick={() => runCheck(selectedSite.id, selectedSite.url, [activeTab])} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-95">{isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Audit Now</button>
          </div>
        </div>

        {activeData.lastRun && (
          <>
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm transition-colors">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 text-center">Executive Scoreboard</h3>
                <div className="flex flex-wrap justify-around items-center gap-8">
                    <CategoryScore label="Performance" score={activeData.lastRun.categories.performance} />
                    <CategoryScore label="Accessibility" score={activeData.lastRun.categories.accessibility} />
                    <CategoryScore label="Best Practices" score={activeData.lastRun.categories.bestPractices} />
                    <CategoryScore label="SEO" score={activeData.lastRun.categories.seo} />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <MetricCard metric={activeData.lastRun.metrics.fcp} onClick={() => handleMetricClick(activeData.lastRun!.metrics.fcp)} isLoading={isLoading} />
              <MetricCard metric={activeData.lastRun.metrics.lcp} onClick={() => handleMetricClick(activeData.lastRun!.metrics.lcp)} isLoading={isLoading} />
              <MetricCard metric={activeData.lastRun.metrics.cls} onClick={() => handleMetricClick(activeData.lastRun!.metrics.cls)} isLoading={isLoading} />
              <MetricCard metric={activeData.lastRun.metrics.tbt} onClick={() => handleMetricClick(activeData.lastRun!.metrics.tbt)} isLoading={isLoading} />
              <MetricCard metric={activeData.lastRun.metrics.si} onClick={() => handleMetricClick(activeData.lastRun!.metrics.si)} isLoading={isLoading} />
              <div className="bg-slate-50 dark:bg-zinc-900/50 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 border-dashed flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500 text-center">
                <span className="text-[10px] font-black uppercase tracking-[0.15em] leading-tight">Click metrics for Element Pinpointing</span>
                <Sparkles className="w-4 h-4 text-indigo-400 mt-2 animate-pulse" />
              </div>
            </div>

            <div className="space-y-8 pt-6">
              <h3 className="text-xl font-black text-slate-900 dark:text-zinc-100 flex items-center gap-3 tracking-tight">
                <AlertTriangle className="w-6 h-6 text-amber-500" /> Improvement Action Plan
              </h3>
              {['performance', 'accessibility', 'bestPractices', 'seo'].map(cat => {
                const audits = (activeData.lastRun?.categoryAudits as any)[cat] || [];
                if (audits.length === 0) return null;
                return (
                  <div key={cat} className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm transition-colors">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/50 font-black text-slate-800 dark:text-zinc-200 uppercase text-xs tracking-[0.2em]">{cat} Diagnostics</div>
                    <div className="divide-y dark:divide-zinc-800">
                      {audits.map((audit: AuditItem) => (
                        <div key={audit.id} className="p-6 hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-all">
                          <div className="flex items-start justify-between gap-6 mb-3">
                            <h4 className="font-bold text-slate-900 dark:text-zinc-100 text-base">{audit.title}</h4>
                            {audit.displayValue && <span className="text-xs font-black text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/40 px-3 py-1 rounded-full whitespace-nowrap">{audit.displayValue}</span>}
                          </div>
                          <p className="text-sm text-slate-600 dark:text-zinc-400 font-medium leading-relaxed mb-6" dangerouslySetInnerHTML={{ __html: audit.description.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">$1</a>') }} />
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
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors duration-500 flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      <nav className="sticky top-0 z-40 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 dark:shadow-none"><Zap className="w-6 h-6 fill-current" /></div>
            <span className="font-black text-2xl tracking-tighter uppercase italic">Speed <span className="text-indigo-600 not-italic">Meter</span></span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => setIsArticleOpen(true)} className="text-lg text-slate-600 dark:text-zinc-400 hover:text-indigo-600 font-black uppercase tracking-[0.2em] px-4 py-2 transition-all">About Tools</button>
            <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-zinc-700 border border-transparent hover:border-slate-200 dark:hover:border-zinc-600 transition-all">
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-12 flex-1 w-full">{view === 'dashboard' ? renderDashboard() : renderDetail()}</main>
      <footer className="bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 py-10 transition-colors"><div className="max-w-7xl mx-auto px-6 text-center text-xs font-black uppercase tracking-[0.3em] text-slate-400">&copy; 2025 Speed Meter &bull; Produced by Noor Muhammad</div></footer>
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-md p-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-zinc-800">
            <div className="p-8 border-b border-slate-50 dark:border-zinc-800 flex justify-between items-center"><h2 className="text-xl font-black uppercase tracking-tight">Add Tracking Target</h2><button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-6 h-6" /></button></div>
            <form onSubmit={addSite} className="p-8 space-y-6">
              <div><label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Endpoint URL</label><input type="text" autoFocus placeholder="domain.com" className={`w-full px-4 py-3 border rounded-xl focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 bg-slate-50 dark:bg-zinc-950 dark:text-white font-bold transition-all outline-none ${urlError ? 'border-red-500' : 'border-slate-200 dark:border-zinc-800'}`} value={newUrl} onChange={(e) => setNewUrl(e.target.value)} />{urlError && <p className="text-xs font-bold text-red-500 mt-2 flex items-center gap-1"><X className="w-3 h-3" /> {urlError}</p>}</div>
              <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-[0.98]">Deploy Tracker</button>
            </form>
          </div>
        </div>
      )}
      {isArticleOpen && <ArticleModal onClose={() => setIsArticleOpen(false)} />}
      {selectedMetric && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 dark:border-zinc-800">
               <div className="p-8 border-b border-slate-50 dark:border-zinc-800 flex justify-between items-center bg-slate-50/50 dark:bg-zinc-800/50 transition-colors">
                 <div className="flex items-center gap-4">
                   <h2 className="text-2xl font-black tracking-tight">{selectedMetric.title}</h2>
                   <ScoreBadge score={Math.round(selectedMetric.score * 100)} size="sm" />
                 </div>
                 <button onClick={() => setSelectedMetric(null)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-7 h-7" /></button>
               </div>
               <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto bg-white dark:bg-zinc-900 transition-colors">
                  <div className="bg-slate-50 dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800 text-center transition-colors">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-2">Technical Reading</span>
                    <span className="text-5xl font-black text-slate-900 dark:text-zinc-100 tracking-tighter">{selectedMetric.displayValue}</span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest whitespace-nowrap">Root Cause Analysis</span>
                      <div className="h-px flex-1 bg-slate-200 dark:bg-zinc-800"></div>
                    </div>
                    <p className="text-base text-slate-900 dark:text-zinc-100 font-bold leading-relaxed transition-colors" dangerouslySetInnerHTML={{ __html: selectedMetric.description?.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-indigo-600 font-black hover:underline">$1</a>') || 'No description available for this metric.' }} />
                  </div>

                  {/* Detailed Element pinpointing based on the current active tab results */}
                  {selectedSite && getActiveTab(selectedSite.id) && (
                    <div className="pt-2">
                       {(() => {
                         const strategy = getActiveTab(selectedSite.id);
                         const audits = selectedSite[strategy].lastRun?.categoryAudits?.performance || [];
                         const metricTitle = selectedMetric.title.toLowerCase();
                         
                         // Map the metric name to relevant audits (e.g., LCP -> 'largest-contentful-paint-element')
                         const matchingAudit = audits.find(a => 
                           a.title.toLowerCase().includes(metricTitle) || 
                           metricTitle.includes(a.title.toLowerCase()) ||
                           (metricTitle.includes('largest') && a.id.includes('paint-element')) ||
                           (metricTitle.includes('layout shift') && a.id.includes('shift-elements'))
                         );
                         
                         if (matchingAudit && matchingAudit.details) {
                           return <AuditSnippet details={matchingAudit.details} />;
                         }
                         return <div className="text-center py-8 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 border-dashed"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">No direct element trace available for this specific run.</p></div>;
                       })()}
                    </div>
                  )}
               </div>
            </div>
         </div>
      )}
    </div>
  );
}