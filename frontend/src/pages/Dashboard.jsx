import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import FeatureImportanceChart from '../components/FeatureImportanceChart';
import TrainingHistoryTable from '../components/TrainingHistoryTable';
import ElasticitySimulator from '../components/ElasticitySimulator';
import { getRuns, getRun } from '../api/api';
import { Activity, Target, TrendingUp, Database, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const [runs, setRuns]             = useState([]);
  const [latestRun, setLatestRun]   = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await getRuns();
      setRuns(data);
      if (data.length > 0) {
        const { data: runDetail } = await getRun(data[0].id);
        setLatestRun(runDetail);
      }
    } catch (e) {
      setError('Cannot reach the backend API. Is it running at http://127.0.0.1:8000?');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const latest = runs[0];

  return (
    <div className="flex min-h-screen" style={{ background: '#0f1117' }}>
      <Sidebar />

      <main className="flex-1 ml-60 p-8 max-w-[1400px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Dashboard</h1>
            <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>
              Bike Demand Elasticity — Model Overview
            </p>
          </div>
          <button className="bd-btn-ghost !px-4" onClick={load}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl mb-6 text-sm font-semibold"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 size={40} className="spin" style={{ color: '#4f6ef7' }} />
          </div>
        )}

        {!loading && (
          <>
            {/* A — Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard label="Latest RMSE"        value={latest?.rmse?.toFixed(2)}         icon={<Activity size={22} />}  color="#4f6ef7" trend="down" trendVal="Lower is better" />
              <StatCard label="Latest MAE"         value={latest?.mae?.toFixed(2)}          icon={<Target size={22} />}    color="#7c5cbf" trend="down" trendVal="Lower is better" />
              <StatCard label="Latest R² Score"    value={latest?.r2_score?.toFixed(4)}     icon={<TrendingUp size={22} />} color="#22c55e" suffix="%" trend="up" trendVal="Higher is better" />
              <StatCard label="Total Training Runs" value={runs.length}                     icon={<Database size={22} />}   color="#f59e0b" />
            </div>

            {/* B — Feature Importance + C — Table */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mb-6">
              <div className="xl:col-span-2 bd-card">
                {latestRun
                  ? <FeatureImportanceChart data={latestRun.feature_importance} />
                  : <div className="flex items-center justify-center h-48 text-sm" style={{ color: '#4a5568' }}>
                      Train a model first to see feature importance.
                    </div>
                }
              </div>
              <div className="xl:col-span-3 bd-card">
                <h3 className="text-base font-bold text-white mb-4">Training History</h3>
                <TrainingHistoryTable runs={runs.slice(0, 5)} />
              </div>
            </div>

            {/* D — Elasticity Simulator */}
            <div className="bd-card">
              <ElasticitySimulator />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
