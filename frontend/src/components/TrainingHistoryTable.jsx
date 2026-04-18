import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Download } from 'lucide-react';

const R2Color  = v => v >= 0.85 ? '#22c55e' : v >= 0.7 ? '#f59e0b' : '#ef4444';
const RMSEColor = v => v <= 45  ? '#22c55e' : v <= 80   ? '#f59e0b' : '#ef4444';

export default function TrainingHistoryTable({ runs, onRowClick }) {
  const [expanded, setExpanded] = useState(null);

  if (!runs?.length) return (
    <div className="flex items-center justify-center h-32 text-sm" style={{ color: '#4a5568' }}>
      No training runs yet.
    </div>
  );

  const download = (run) => {
    const blob = new Blob([JSON.stringify(run, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url;
    a.download = `run_${run.id}.json`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #2a2d4a' }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: '#1a1d2e', borderBottom: '1px solid #2a2d4a' }}>
            {['', 'Run ID', 'Date', 'RMSE', 'MAE', 'R²', 'Actions'].map(h => (
              <th key={h} className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {runs.map((run, idx) => (
            <React.Fragment key={run.id}>
              <tr
                onClick={() => { setExpanded(expanded === run.id ? null : run.id); onRowClick?.(run.id); }}
                style={{
                  background: idx % 2 === 0 ? '#1e2139' : '#1a1d2e',
                  borderBottom: '1px solid #2a2d4a',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,110,247,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#1e2139' : '#1a1d2e'}
              >
                <td className="py-3 px-4" style={{ color: '#64748b' }}>
                  {expanded === run.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
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
                <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                  <button className="bd-btn-ghost !py-1.5 !px-3 text-xs" onClick={() => download(run)}>
                    <Download size={12} /> JSON
                  </button>
                </td>
              </tr>

              {expanded === run.id && (
                <tr style={{ background: 'rgba(79,110,247,0.04)', borderBottom: '1px solid #2a2d4a' }}>
                  <td colSpan={7} className="px-6 py-4">
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div className="bd-card !py-3">
                        <p className="font-bold" style={{ color: '#64748b' }}>Model Path</p>
                        <p className="font-mono break-all mt-1" style={{ color: '#4f6ef7', fontSize: 11 }}>
                          {run.model_path || '—'}
                        </p>
                      </div>
                      <div className="bd-card !py-3 col-span-2">
                        <p className="font-bold mb-2" style={{ color: '#64748b' }}>Feature Importance</p>
                        {run.feature_importance
                          ? Object.entries(run.feature_importance)
                              .sort((a,b) => b[1]-a[1]).slice(0,5)
                              .map(([k,v]) => (
                                <div key={k} className="flex items-center gap-3 mb-1.5">
                                  <span style={{ color: '#94a3b8', width: 80 }} className="truncate">{k}</span>
                                  <div className="flex-1 h-1.5 rounded-full" style={{ background: '#2a2d4a' }}>
                                    <div className="h-1.5 rounded-full"
                                      style={{ width: `${Math.min(v * 400, 100)}%`, background: 'linear-gradient(90deg,#4f6ef7,#7c5cbf)' }} />
                                  </div>
                                  <span style={{ color: '#64748b' }}>{Number(v).toFixed(3)}</span>
                                </div>
                              ))
                          : <p style={{ color: '#4a5568' }}>No data</p>
                        }
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
