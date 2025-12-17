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
  LayoutDashboard
} from './components/Icons';
import { Site, PageSpeedResult, StrategyData, Metric, ThresholdConfig, AuditItem } from './types';
import { runPageSpeedCheck } from './services/pageSpeedService';
import { generatePDF } from './services/pdfService';
import HistoryChart from './components/HistoryChart';
import ArticleModal from './components/ArticleModal';

// --- Helper Components ---

const ScoreBadge: React.FC<{ score: number; size?: 'sm' | 'md' | 'lg' }> = ({ score, size = 'md' }) => {
  let colorClass = 'text-red-600 bg-red-50 border-red-200';
  if (score >= 90) colorClass = 'text-emerald-600 bg-emerald-50 border-emerald-200';
  else if (score >= 50) colorClass = 'text-amber-600 bg-amber-50 border-amber-200';

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

  let color = '#ef4444'; // red-500
  let bgColor = '#fee2e2'; // red-100
  if (score >= 90) { color = '#10b981'; bgColor = '#d1fae5'; } // emerald-500, emerald-100
  else if (score >= 50) { color = '#f59e0b'; bgColor = '#fef3c7'; } // amber-500, amber-100

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center">
        <svg height={radius * 2 + stroke * 2} width={radius * 2 + stroke * 2} className="rotate-[-90deg]">
          <circle
            stroke={bgColor}
            fill="transparent"
            strokeWidth={stroke}
            r={radius}
            cx={radius + stroke}
            cy={radius + stroke}
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
      <span className="mt-2 text-sm font-medium text-slate-600">{label}</span>
    </div>
  );
};

const MetricCard: React.FC<{ 
  metric: Metric; 
  onClick: () => void;
}> = ({ metric, onClick }) => {
  let indicator = 'bg-red-500';
  if (metric.score >= 0.9) indicator = 'bg-emerald-500';
  else if (metric.score >= 0.5) indicator = 'bg-amber-500';

  return (
    <div 
      onClick={onClick}
      className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
    >
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1 flex items-center gap-1">
          {metric.title}
          <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
        </p>
        <p className="text-lg font-bold text-slate-900">{metric.displayValue}</p>
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
    <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg border flex items-center gap-3 animate-in slide-in-from-right fade-in duration-300 max-w-sm ${type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
      {type === 'warning' ? <Activity className="w-5 h-5 shrink-0" /> : <CheckCircle className="w-5 h-5 shrink-0" />}
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="ml-auto opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
    </div>
  );
};

// Component to render code snippets/nodes from Lighthouse
const AuditSnippet: React.FC<{ details: any }> = ({ details }) => {
  if (!details || !details.items || details.items.length === 0) return null;

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-px flex-1 bg-slate-200"></div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Failing Elements</span>
        <div className="h-px flex-1 bg-slate-200"></div>
      </div>
      <div className="space-y-3">
        {details.items.slice(0, 5).map((item: any, idx: number) => {
          const node = item.node;
          if (!node) return null;
          return (
            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden flex flex-col">
              <div className="px-3 py-1.5 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
                <span className="text-[10px] font-mono text-blue-700 truncate max-w-[80%]">{node.selector}</span>
                {item.explanation && (
                  <span className="text-[10px] text-amber-600 font-medium px-1.5 py-0.5 bg-amber-50 rounded border border-amber-100">
                    {item.explanation}
                  </span>
                )}
              </div>
              <div className="p-3 space-y-2">
                {node.nodeLabel && (
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Visible Content</span>
                    <p className="text-xs text-slate-800 font-medium">{node.nodeLabel}</p>
                  </div>
                )}
                <div>
                   <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">HTML Snippet</span>
                   <code className="text-[11px] text-pink-600 block whitespace-pre-wrap break-all bg-white p-2 rounded border border-slate-200 font-mono leading-relaxed">
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

// --- Main App Component ---

export default function App() {
  // State
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
        const strategyData: StrategyData = {
          status: s.status,
          error: s.error,
          lastRun: s.lastRun,
          history: s.history || []
        };
        const emptyData: StrategyData = { status: 'idle', history: [] };
        mobileData = isMobile ? strategyData : emptyData;
        desktopData = !isMobile ? strategyData : emptyData;
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

  // Metric Detail Modal State
  const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);

  // Refs
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  // Persistence
  useEffect(() => {
    localStorage.setItem('speedmonitor_sites', JSON.stringify(sites));
  }, [sites]);

  const addSite = (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError('');
    if (!newUrl) {
        setUrlError('Please enter a website URL');
        return;
    }
    let formattedUrl = newUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }
    try {
      const urlObj = new URL(formattedUrl);
      if (!urlObj.hostname.includes('.')) {
        setUrlError('Please enter a valid domain (e.g. example.com)');
        return;
      }
    } catch (err) {
      setUrlError('Please enter a valid URL format');
      return;
    }

    const newSite: Site = {
      id: crypto.randomUUID(),
      url: formattedUrl,
      desktop: { status: 'idle', history: [] },
      mobile: { status: 'idle', history: [] }
    };

    setSites([newSite, ...sites]);
    setNewUrl('');
    setUrlError('');
    setIsAddModalOpen(false);
    setActiveSiteTab(prev => ({ ...prev, [newSite.id]: 'desktop' }));
    runCheck(newSite.id, formattedUrl);
  };

  const removeSite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const controller = abortControllers.current.get(id);
    if (controller) {
      controller.abort();
      abortControllers.current.delete(id);
    }
    setSites(sites.filter(s => s.id !== id));
    if (selectedSiteId === id) setView('dashboard');
  };

  const stopCheck = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const controller = abortControllers.current.get(id);
    if (controller) {
      controller.abort();
      abortControllers.current.delete(id);
    }
    setSites(prev => prev.map(s => {
       if (s.id !== id) return s;
       return {
         ...s,
         desktop: s.desktop.status === 'loading' ? { ...s.desktop, status: 'idle' } : s.desktop,
         mobile: s.mobile.status === 'loading' ? { ...s.mobile, status: 'idle' } : s.mobile,
       };
    }));
  };

  const checkThresholds = (siteUrl: string, result: PageSpeedResult) => {
    const breaches: string[] = [];
    if ((result.metrics.lcp.numericValue / 1000) > thresholds.lcp) {
      breaches.push(`LCP ${(result.metrics.lcp.numericValue / 1000).toFixed(2)}s > ${thresholds.lcp}s`);
    }
    if (result.metrics.cls.numericValue > thresholds.cls) {
      breaches.push(`CLS ${result.metrics.cls.numericValue.toFixed(3)} > ${thresholds.cls}`);
    }
    if (result.overallScore < thresholds.score) {
      breaches.push(`Score ${result.overallScore} < ${thresholds.score}`);
    }
    if (breaches.length > 0) {
      setNotification({
        type: 'warning',
        message: `${new URL(siteUrl).hostname}: Thresholds Breached! (${breaches.join(', ')})`
      });
    }
  };

  const runCheck = async (id: string, url: string, strategies: ('mobile' | 'desktop')[] = ['mobile', 'desktop']) => {
    const existingController = abortControllers.current.get(id);
    if (existingController) {
      existingController.abort();
    }
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
      const promises = strategies.map(async (strategy) => {
        try {
          const result = await runPageSpeedCheck(url, strategy, controller.signal);
          checkThresholds(url, result);
          setSites(prev => prev.map(s => {
            if (s.id !== id) return s;
            const currentData = strategy === 'desktop' ? s.desktop : s.mobile;
            const updatedData: StrategyData = {
              status: 'success',
              lastRun: result,
              history: [...currentData.history, result]
            };
            return { ...s, [strategy]: updatedData };
          }));
        } catch (err: any) {
          if (err.name === 'AbortError') throw err;
          setSites(prev => prev.map(s => {
            if (s.id !== id) return s;
             const updatedData: StrategyData = {
              ...(strategy === 'desktop' ? s.desktop : s.mobile),
              status: 'error',
              error: err.message
            };
            return { ...s, [strategy]: updatedData };
          }));
        }
      });
      await Promise.all(promises);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setSites(prev => prev.map(s => {
          if (s.id !== id) return s;
          return {
            ...s,
            desktop: s.desktop.status === 'loading' ? { ...s.desktop, status: 'idle' } : s.desktop,
            mobile: s.mobile.status === 'loading' ? { ...s.mobile, status: 'idle' } : s.mobile,
          };
        }));
      }
    } finally {
      abortControllers.current.delete(id);
    }
  };

  const runAllChecks = () => {
    sites.forEach(site => runCheck(site.id, site.url));
  };

  const handleExportPDF = () => {
    if (!selectedSite) return;
    const mobileData = selectedSite.mobile.lastRun;
    const desktopData = selectedSite.desktop.lastRun;
    if (mobileData || desktopData) {
        generatePDF(selectedSite.url, mobileData, desktopData);
    }
  };

  const toggleTab = useCallback((siteId: string, tab: 'desktop' | 'mobile', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveSiteTab(prev => {
        if (prev[siteId] === tab) return prev;
        return { ...prev, [siteId]: tab };
    });
  }, []);

  const getActiveTab = useCallback((siteId: string) => activeSiteTab[siteId] || 'desktop', [activeSiteTab]);

  const filteredSites = useMemo(() => 
    sites.filter(s => s.url.toLowerCase().includes(searchQuery.toLowerCase())),
  [sites, searchQuery]);

  const selectedSite = useMemo(() => 
    sites.find(s => s.id === selectedSiteId),
  [sites, selectedSiteId]);

  // --- Render Sections ---

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search sites..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={runAllChecks} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors">
            <RefreshCw className="w-4 h-4" />
            <span>Sync All</span>
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-all hover:shadow-md">
            <Plus className="w-4 h-4" />
            <span>Add Site</span>
          </button>
        </div>
      </div>

      {filteredSites.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
          <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
            <Activity className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No sites tracked yet</h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto">Add your first website to start monitoring performance metrics and track improvements over time.</p>
          <button onClick={() => setIsAddModalOpen(true)} className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">Add Website</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSites.map(site => {
            const activeTab = getActiveTab(site.id);
            const activeData = site[activeTab];
            const isLoadingAny = site.desktop.status === 'loading' || site.mobile.status === 'loading';
            let hasAlert = false;
            if (activeData.lastRun) {
               if (activeData.lastRun.overallScore < thresholds.score) hasAlert = true;
               if ((activeData.lastRun.metrics.lcp.numericValue/1000) > thresholds.lcp) hasAlert = true;
               if (activeData.lastRun.metrics.cls.numericValue > thresholds.cls) hasAlert = true;
            }

            return (
              <div key={site.id} onClick={() => { setSelectedSiteId(site.id); setView('detail'); }} className={`group bg-white rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col ${hasAlert ? 'border-amber-200 ring-1 ring-amber-100' : 'border-slate-200'}`}>
                <div className="p-4 border-b border-slate-50 relative">
                  {hasAlert && (
                    <div className="absolute top-0 right-0 p-2">
                      <div className="bg-amber-100 text-amber-600 rounded-full p-1" title="Thresholds Breached"><Activity className="w-4 h-4" /></div>
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0"><Globe className="w-5 h-5" /></div>
                      <div className="min-w-0 pr-6">
                        <h3 className="font-semibold text-slate-900 truncate" title={site.url}>{new URL(site.url).hostname}</h3>
                        {activeData.lastRun && <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />{new Date(activeData.lastRun.timestamp).toLocaleDateString()}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {isLoadingAny ? (
                         <button onClick={(e) => stopCheck(e, site.id)} className="p-2 bg-red-50 rounded-lg text-red-500 hover:bg-red-100 transition-colors" title="Stop Analysis"><Square className="w-4 h-4 fill-current" /></button>
                      ) : (
                        <button onClick={(e) => { e.stopPropagation(); runCheck(site.id, site.url); }} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors" title="Refresh"><RefreshCw className="w-4 h-4" /></button>
                      )}
                      <button onClick={(e) => removeSite(e, site.id)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100" title="Remove"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="flex p-1 bg-slate-100 rounded-lg gap-1">
                    <button onClick={(e) => toggleTab(site.id, 'desktop', e)} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'desktop' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Monitor className="w-3.5 h-3.5" />Desktop</button>
                    <button onClick={(e) => toggleTab(site.id, 'mobile', e)} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'mobile' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Smartphone className="w-3.5 h-3.5" />Mobile</button>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-center min-h-[160px]">
                  {activeData.status === 'loading' ? (
                     <div className="flex flex-col items-center justify-center py-6 gap-3 animate-in fade-in">
                       <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                       <p className="text-sm text-slate-500 font-medium">Running audit...</p>
                     </div>
                  ) : activeData.status === 'error' ? (
                    <div className="text-center py-4 w-full animate-in fade-in">
                      <div className="w-8 h-8 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2"><X className="w-4 h-4" /></div>
                      <p className="text-xs text-red-600 font-medium mb-2">Failed</p>
                      <p className="text-[10px] text-slate-400 truncate px-4">{activeData.error}</p>
                    </div>
                  ) : activeData.lastRun ? (
                    <div className="flex items-center justify-between gap-4 animate-in fade-in">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-slate-500 font-medium">Score</span>
                        <span className={`text-3xl font-bold ${activeData.lastRun.overallScore < thresholds.score ? 'text-amber-600' : 'text-slate-900'}`}>{activeData.lastRun.overallScore}</span>
                      </div>
                      <div className="flex-1">
                         <div className="grid grid-cols-2 gap-2">
                            <div className={`p-2 rounded border ${ (activeData.lastRun.metrics.lcp.numericValue/1000) > thresholds.lcp ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
                               <p className="text-[10px] text-slate-500 uppercase font-bold">LCP</p>
                               <p className={`text-sm font-semibold ${(activeData.lastRun.metrics.lcp.numericValue/1000) > thresholds.lcp ? 'text-amber-700' : activeData.lastRun.metrics.lcp.score > 0.9 ? 'text-emerald-600' : 'text-slate-700'}`}>{activeData.lastRun.metrics.lcp.displayValue}</p>
                            </div>
                            <div className={`p-2 rounded border ${ activeData.lastRun.metrics.cls.numericValue > thresholds.cls ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
                               <p className="text-[10px] text-slate-500 uppercase font-bold">CLS</p>
                               <p className={`text-sm font-semibold ${activeData.lastRun.metrics.cls.numericValue > thresholds.cls ? 'text-amber-700' : activeData.lastRun.metrics.cls.score > 0.9 ? 'text-emerald-600' : 'text-slate-700'}`}>{activeData.lastRun.metrics.cls.displayValue}</p>
                            </div>
                         </div>
                      </div>
                      <ScoreBadge score={activeData.lastRun.overallScore} />
                    </div>
                  ) : (
                     <div className="text-center py-6 text-slate-400 text-sm">No data yet<button onClick={(e) => { e.stopPropagation(); runCheck(site.id, site.url); }} className="block mx-auto mt-2 text-blue-600 text-xs font-medium hover:underline">Run Analysis</button></div>
                  )}
                </div>
                <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between"><span className="text-xs text-slate-500 font-medium">View Full Report</span><ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" /></div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderAuditDetails = (result: PageSpeedResult) => {
    const categories = [
      { id: 'performance', label: 'Performance', score: result.categories.performance, icon: <Zap className="w-4 h-4" /> },
      { id: 'accessibility', label: 'Accessibility', score: result.categories.accessibility, icon: <Activity className="w-4 h-4" /> },
      { id: 'bestPractices', label: 'Best Practices', score: result.categories.bestPractices, icon: <CheckCircle className="w-4 h-4" /> },
      { id: 'seo', label: 'SEO', score: result.categories.seo, icon: <Search className="w-4 h-4" /> }
    ];

    const failedCategories = categories.filter(c => c.score < 90);

    if (failedCategories.length === 0) return null;

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Optimization Opportunities
        </h3>
        <div className="space-y-4">
          {failedCategories.map(cat => (
            <div key={cat.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-700">
                  {cat.icon}
                  {cat.label}
                </div>
                <div className={`px-2 py-0.5 rounded text-xs font-bold ${cat.score >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                  Score: {cat.score}
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {(result.categoryAudits as any)[cat.id].map((audit: AuditItem) => (
                  <div key={audit.id} className="p-5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h4 className="font-semibold text-slate-900 text-sm">{audit.title}</h4>
                      {audit.displayValue && <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded whitespace-nowrap">{audit.displayValue}</span>}
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: audit.description.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-blue-600 hover:underline">$1</a>') }} />
                    
                    {/* Render specific snippets/failing elements for the user to identify issues */}
                    <AuditSnippet details={audit.details} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDetail = () => {
    if (!selectedSite) return null;
    const activeTab = getActiveTab(selectedSite.id);
    const activeData = selectedSite[activeTab];
    const isLoading = activeData.status === 'loading';

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('dashboard')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"><ChevronRight className="w-5 h-5 rotate-180" /></button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{new URL(selectedSite.url).hostname}</h1>
              <a href={selectedSite.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">{selectedSite.url}<ArrowUpRight className="w-3 h-3" /></a>
            </div>
          </div>
          <div className="flex gap-2">
             <div className="flex bg-white border border-slate-200 rounded-lg p-1">
                <button onClick={() => toggleTab(selectedSite.id, 'desktop')} className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${activeTab === 'desktop' ? 'bg-slate-100 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}><Monitor className="w-4 h-4" />Desktop</button>
                <button onClick={() => toggleTab(selectedSite.id, 'mobile')} className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${activeTab === 'mobile' ? 'bg-slate-100 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}><Smartphone className="w-4 h-4" />Mobile</button>
             </div>
             <button onClick={() => handleExportPDF()} className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg transition-colors" title="Export PDF Report"><Download className="w-4 h-4" /></button>
             {isLoading ? (
                <button onClick={(e) => stopCheck(e, selectedSite.id)} className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"><Square className="w-4 h-4 fill-current" />Stop</button>
             ) : (
                <button onClick={() => runCheck(selectedSite.id, selectedSite.url, [activeTab])} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"><RefreshCw className="w-4 h-4" />Run Audit</button>
             )}
          </div>
        </div>

        {activeData.status === 'error' ? (
           <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center"><div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><X className="w-6 h-6" /></div><h3 className="text-lg font-bold text-red-800 mb-2">Analysis Failed</h3><p className="text-red-600 mb-4">{activeData.error}</p><button onClick={() => runCheck(selectedSite.id, selectedSite.url, [activeTab])} className="px-4 py-2 bg-white border border-red-200 text-red-700 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors">Try Again</button></div>
        ) : !activeData.lastRun && !isLoading ? (
           <div className="bg-white border border-slate-200 rounded-xl p-12 text-center"><div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4"><Activity className="w-8 h-8" /></div><h3 className="text-lg font-semibold text-slate-900">No Data Available</h3><p className="text-slate-500 mt-2 mb-6">Run an audit to see performance metrics for this device strategy.</p><button onClick={() => runCheck(selectedSite.id, selectedSite.url, [activeTab])} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">Run Audit</button></div>
        ) : (
          <>
            {/* Visual Page Preview */}
            {activeData.lastRun?.screenshot && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                   <Globe className="w-4 h-4" />
                   Page Preview
                </h3>
                <div className="rounded-lg overflow-hidden border border-slate-100 bg-slate-50 flex justify-center p-4">
                   <img 
                     src={activeData.lastRun.screenshot} 
                     alt="Page Screenshot" 
                     className="max-h-[350px] w-auto shadow-2xl rounded-sm"
                   />
                </div>
                <p className="text-[10px] text-slate-400 mt-3 text-center italic">Screenshot of the page as rendered during the analysis.</p>
              </div>
            )}

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                {isLoading && <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-6">Audits Summary</h3>
                <div className="flex flex-wrap justify-around items-center gap-6">
                    {activeData.lastRun && activeData.lastRun.categories ? (
                        <>
                           <CategoryScore label="Performance" score={activeData.lastRun.categories.performance} />
                           <CategoryScore label="Accessibility" score={activeData.lastRun.categories.accessibility} />
                           <CategoryScore label="Best Practices" score={activeData.lastRun.categories.bestPractices} />
                           <CategoryScore label="SEO" score={activeData.lastRun.categories.seo} />
                        </>
                    ) : activeData.lastRun ? (<CategoryScore label="Performance" score={activeData.lastRun.overallScore} />) : null}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative">
              {isLoading && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 rounded-xl"></div>}
              {activeData.lastRun && (
                <>
                  <MetricCard metric={activeData.lastRun.metrics.fcp} onClick={() => setSelectedMetric(activeData.lastRun!.metrics.fcp)} />
                  <MetricCard metric={activeData.lastRun.metrics.lcp} onClick={() => setSelectedMetric(activeData.lastRun!.metrics.lcp)} />
                  <MetricCard metric={activeData.lastRun.metrics.cls} onClick={() => setSelectedMetric(activeData.lastRun!.metrics.cls)} />
                  <MetricCard metric={activeData.lastRun.metrics.tbt} onClick={() => setSelectedMetric(activeData.lastRun!.metrics.tbt)} />
                  <MetricCard metric={activeData.lastRun.metrics.si} onClick={() => setSelectedMetric(activeData.lastRun!.metrics.si)} />
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 border-dashed text-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest leading-tight">Click Metrics for Detailed Breakdown</span>
                  </div>
                </>
              )}
            </div>

            {activeData.lastRun && renderAuditDetails(activeData.lastRun)}

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
               <div className="flex items-center justify-between mb-6"><h3 className="font-bold text-slate-900 flex items-center gap-2"><BarChart2 className="w-5 h-5 text-slate-400" />Performance History</h3></div>
               <HistoryChart history={activeData.history} />
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      <nav className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">Speed <span className="text-blue-600">Meter</span></span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsArticleOpen(true)} className="text-xs text-slate-500 hover:text-blue-600 font-medium hidden sm:block">About Tool</button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">{view === 'dashboard' ? renderDashboard() : renderDetail()}</main>
      <footer className="bg-white border-t border-slate-200 mt-auto"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"><div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500"><div className="flex flex-col md:flex-row gap-1 md:gap-4 items-center"><span>&copy; 2025 All rights reserved.</span><span className="hidden md:inline">&bull;</span><span>Developed by Noor Muhammad</span></div><div className="font-medium text-slate-700">Credit goes to Apna Developer</div></div></div></footer>
      {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center"><h2 className="text-lg font-bold text-slate-900">Add New Website</h2><button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button></div>
            <form onSubmit={addSite} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Website URL</label><input type="text" autoFocus placeholder="example.com" className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${urlError ? 'border-red-300 focus:ring-red-200 bg-red-50' : 'border-slate-300'}`} value={newUrl} onChange={(e) => { setNewUrl(e.target.value); setUrlError(''); }} />{urlError && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><X className="w-3 h-3" />{urlError}</p>}</div>
              <div className="pt-2"><button type="submit" disabled={!newUrl} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium shadow-sm transition-colors">Start Monitoring</button></div>
            </form>
          </div>
        </div>
      )}
      {isArticleOpen && <ArticleModal onClose={() => setIsArticleOpen(false)} />}
      {selectedMetric && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
               <div className="p-6 border-b border-slate-100 flex justify-between items-center"><div className="flex items-center gap-3"><h2 className="text-xl font-bold text-slate-900">{selectedMetric.title}</h2><span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${selectedMetric.score >= 0.9 ? 'bg-emerald-100 text-emerald-700' : selectedMetric.score >= 0.5 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{selectedMetric.score >= 0.9 ? 'Good' : selectedMetric.score >= 0.5 ? 'Needs Improvement' : 'Poor'}</span></div><button onClick={() => setSelectedMetric(null)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button></div>
               <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                  <div className="flex items-center justify-center py-6 bg-slate-50 rounded-xl border border-slate-100"><div className="text-center"><span className="block text-4xl font-bold text-slate-900 mb-1">{selectedMetric.displayValue}</span><span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Current Value</span></div></div>
                  {selectedMetric.description && <div className="text-slate-600 leading-relaxed text-sm" dangerouslySetInnerHTML={{ __html: selectedMetric.description.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-blue-600 hover:underline font-bold">$1</a>') }} />}
               </div>
            </div>
         </div>
      )}
    </div>
  );
}