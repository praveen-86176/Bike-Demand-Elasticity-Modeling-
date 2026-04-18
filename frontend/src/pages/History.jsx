import React, { useEffect, useState, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import FeatureImportanceChart from '../components/FeatureImportanceChart';
import { getRuns, getRun } from '../api/api';
import {
  Loader2, AlertCircle, ChevronDown, ChevronRight,
  Download, RefreshCw, ArrowUpDown, X
} from 'lucide-react';

const R2Color   = v => v >= 0.85 ? '#22c55e' : v >= 0.7 ? '#f59e0b' : '#ef4444';
const RMSEColor = v => v <= 45   ? '#22c55e' : v <= 80  ? '#f59e0b' : '#ef4444';

export default function History() {
  const [runs, setRuns]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [expanded, setExpanded]   = useState(null);
  const [detailData, setDetailData] = useState({});
  const [loadingDetail, setLoadingDetail] = useState(null);

  // Filter / sort state
  const [sortKey, setSortKey]   = useState('id');
  const [sortDir, setSortDir]   = useState('desc');
  const [filterMin, setFilterMin] = useState({ rmse: '', r2: '', mae: '' });

  const load = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await getRuns();
      setRuns(data);
    } catch {
      setError('Cannot reach backend. Is it running at http://127.0.0.1:8000?');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleExpand = async (id) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!detailData[id]) {
      setLoadingDetail(id);
      try {
        const { data } = await getRun(id);
        setDetailData(prev => ({ ...prev, [id]: data }));
      } catch {}
      finally { setLoadingDetail(null); }
    }
  };

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const processedRuns = useMemo(() => {
    let result = [...runs];
    if (filterMin.rmse !== '')  result = result.filter(r => r.rmse  <= parseFloat(filterMin.rmse));
    if (filterMin.mae  !== '')  result = result.filter(r => r.mae   <= parseFloat(filterMin.mae));
    if (filterMin.r2   !== '')  result = result.filter(r => r.r2_score >= parseFloat(filterMin.r2));
    result.sort((a, b) => {
      const av = sortKey === 'created_at' ? new Date(a[sortKey]) : a[sortKey];
      const bv = sortKey === 'created_at' ? new Date(b[sortKey]) : b[sortKey];
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return result;
  }, [runs, sortKey, sortDir, filterMin]);

  const downloadRun = (run) => {
    const detail = detailData[run.id] || run;
    const blob = new Blob([JSON.stringify(detail, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `run_${run.id}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const SortTh = ({ label, k }) => (
    <th className="py-3 px-4 text-left cursor-pointer select-none group"
      onClick={() => toggleSort(k)}
      style={{ color: sortKey === k ? '#4f6ef7' : '#64748b' }}>
      <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
        {label}
        <ArrowUpDown size={12} className="opacity-50 group-hover:opacity-100 transition-opacity" />
      </span>
    </th>
  );

  return (
    <div className="flex min-h-screen" style={{ background: '#0f1117' }}>
      <Sidebar />

      <main className="flex-1 ml-60 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Training History</h1>
            <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>
              {runs.length} run{runs.length !== 1 ? 's' : ''} recorded — click a row to expand details
            </p>
          </div>
          <button className="bd-btn-ghost !px-4" onClick={load}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl mb-6 text-sm font-semibold"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Filter bar */}
        {!loading && runs.length > 0 && (
          <div className="bd-card mb-6 flex flex-wrap items-end gap-4">
            <p className="text-xs font-bold uppercase tracking-wider w-full" style={{ color: '#64748b' }}>
              Filter Results
            </p>
            {[
              { key: 'rmse', label: 'Max RMSE', ph: 'e.g. 45' },
              { key: 'mae',  label: 'Max MAE',  ph: 'e.g. 30' },
              { key: 'r2',   label: 'Min R²',   ph: 'e.g. 0.85' },
            ].map(f => (
              <div key={f.key} className="flex flex-col gap-1">
                <label className="text-xs font-semibold" style={{ color: '#94a3b8' }}>{f.label}</label>
                <input className="bd-input !py-2 !px-3 w-32 text-xs"
                  type="number" placeholder={f.ph} value={filterMin[f.key]}
                  onChange={e => setFilterMin(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
            {Object.values(filterMin).some(v => v !== '') && (
              <button className="bd-btn-ghost !py-2 text-xs"
                onClick={() => setFilterMin({ rmse: '', r2: '', mae: '' })}>
                <X size={12} /> Clear Filters
              </button>
            )}
            <p className="text-xs ml-auto" style={{ color: '#64748b' }}>
              Showing {processedRuns.length} / {runs.length} runs
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 size={40} className="spin" style={{ color: '#4f6ef7' }} />
          </div>
        )}

        {/* Empty */}
        {!loading && runs.length === 0 && !error && (
          <div className="bd-card text-center py-16">
            <p className="text-4xl mb-3">📂</p>
            <p className="font-semibold text-white mb-1">No training runs yet</p>
            <p className="text-sm" style={{ color: '#64748b' }}>Go to Train Model to get started.</p>
          </div>
        )}

        {/* Table */}
        {!loading && processedRuns.length > 0 && (
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #2a2d4a' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#1a1d2e', borderBottom: '1px solid #2a2d4a' }}>
                  <th className="py-3 px-4 w-8" />
                  <SortTh label="Run ID"   k="id" />
                  <SortTh label="Date"     k="created_at" />
                  <SortTh label="RMSE"     k="rmse" />
                  <SortTh label="MAE"      k="mae" />
                  <SortTh label="R² Score" k="r2_score" />
                  <th className="py-3 px-4 text-right text-xs font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {processedRuns.map((run, idx) => (
                  <React.Fragment key={run.id}>
                    <tr
                      onClick={() => toggleExpand(run.id)}
                      style={{
                        background: idx % 2 === 0 ? '#1e2139' : '#1a1d2e',
                        borderBottom: '1px solid #2a2d4a',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,110,247,0.07)'}
                      onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#1e2139' : '#1a1d2e'}
                    >
                      <td className="py-3 px-4" style={{ color: '#64748b' }}>
                        {expanded === run.id
                          ? <ChevronDown size={14} />
                          : <ChevronRight size={14} />}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold"
                          style={{ background: 'rgba(79,110,247,0.15)', color: '#4f6ef7' }}>
                          #{run.id}
                        </span>
                      </td>
                      <td className="py-3 px-4" style={{ color: '#94a3b8' }}>
                        {new Date(run.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-bold" style={{ color: RMSEColor(run.rmse) }}>
                        {run.rmse?.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 font-bold" style={{ color: '#f59e0b' }}>
                        {run.mae?.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 font-bold" style={{ color: R2Color(run.r2_score) }}>
                        {run.r2_score?.toFixed(4)}
                      </td>
                      <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <button className="bd-btn-ghost !py-1.5 !px-3 text-xs"
                          onClick={() => downloadRun(run)}>
                          <Download size={12} /> JSON
                        </button>
                      </td>
                    </tr>

                    {/* Expanded row */}
                    {expanded === run.id && (
                      <tr style={{ background: 'rgba(79,110,247,0.04)', borderBottom: '1px solid #2a2d4a' }}>
                        <td colSpan={7} className="px-8 py-6">
                          {loadingDetail === run.id ? (
                            <div className="flex items-center gap-3" style={{ color: '#64748b' }}>
                              <Loader2 size={18} className="spin" style={{ color: '#4f6ef7' }} />
                              Loading run details…
                            </div>
                          ) : detailData[run.id] ? (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                              {/* Metrics */}
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#64748b' }}>
                                  Full Metrics
                                </p>
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                  {[
                                    { label: 'R²',   value: detailData[run.id].r2_score?.toFixed(4), color: R2Color(detailData[run.id].r2_score) },
                                    { label: 'RMSE', value: detailData[run.id].rmse?.toFixed(2),      color: RMSEColor(detailData[run.id].rmse) },
                                    { label: 'MAE',  value: detailData[run.id].mae?.toFixed(2),       color: '#f59e0b' },
                                  ].map(m => (
                                    <div key={m.label} className="bd-card !py-3 text-center">
                                      <p className="text-2xl font-extrabold" style={{ color: m.color }}>{m.value}</p>
                                      <p className="text-xs font-bold uppercase mt-1" style={{ color: '#64748b' }}>{m.label}</p>
                                    </div>
                                  ))}
                                </div>
                                <div className="bd-card !py-3 break-all">
                                  <p className="text-xs font-bold uppercase mb-1" style={{ color: '#64748b' }}>Model Path</p>
                                  <code className="text-xs font-mono" style={{ color: '#4f6ef7' }}>
                                    {detailData[run.id].model_path || '—'}
                                  </code>
                                </div>
                              </div>
                              {/* Feature Importance */}
                              <div className="bd-card">
                                <FeatureImportanceChart
                                  data={detailData[run.id].feature_importance}
                                  title={`Feature Importance — Run #${run.id}`}
                                />
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm" style={{ color: '#4a5568' }}>No detail available.</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
