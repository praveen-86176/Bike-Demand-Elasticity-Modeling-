import React, { useState, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine
} from 'recharts';
import { predict } from '../api/api';
import { Loader2 } from 'lucide-react';

const DEFAULT = { temp: 0.5, hum: 0.5, windspeed: 0.2, hr: 12,
  season: 1, holiday: 0, workingday: 1, weathersit: 1,
  atemp: 0.5, mnth: 6, weekday: 1 };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1e2139', border: '1px solid #2a2d4a', borderRadius: 10, padding: '10px 14px' }}>
      <p style={{ color: '#94a3b8', fontSize: 11 }}>Hour {label}:00</p>
      <p style={{ color: '#4f6ef7', fontWeight: 700, fontSize: 15 }}>{payload[0].value} bikes</p>
    </div>
  );
};

export default function ElasticitySimulator() {
  const [params, setParams] = useState(DEFAULT);
  const [demand, setDemand] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingChart, setLoadingChart] = useState(false);

  const runPredict = useCallback(async (p = params) => {
    setLoading(true);
    try {
      const { data } = await predict(p);
      setDemand(data.predicted_demand);
    } catch { setDemand(null); }
    finally { setLoading(false); }
  }, [params]);

  const handle = (key, val) => {
    const next = { ...params, [key]: parseFloat(val) };
    setParams(next);
    runPredict(next);
  };

  const build24hChart = async () => {
    setLoadingChart(true);
    const results = [];
    for (let hr = 0; hr < 24; hr++) {
      try {
        const { data } = await predict({ ...params, hr });
        results.push({ hr, demand: data.predicted_demand });
      } catch { results.push({ hr, demand: 0 }); }
    }
    setChartData(results);
    setLoadingChart(false);
  };

  const sliders = [
    { key: 'temp',      label: 'Temperature',  min: 0,  max: 1,  step: 0.01 },
    { key: 'hum',       label: 'Humidity',     min: 0,  max: 1,  step: 0.01 },
    { key: 'windspeed', label: 'Windspeed',    min: 0,  max: 1,  step: 0.01 },
    { key: 'hr',        label: 'Hour of Day',  min: 0,  max: 23, step: 1, fmt: v => `${v}:00` },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-white">Elasticity Simulator</h3>
          <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>Adjust signals in real-time</p>
        </div>
        <button className="bd-btn !px-4 !py-2 text-xs" onClick={build24hChart} disabled={loadingChart}>
          {loadingChart ? <Loader2 size={14} className="spin" /> : null}
          {loadingChart ? 'Building…' : 'View 24h Curve'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sliders */}
        <div className="space-y-5">
          {sliders.map(s => (
            <div key={s.key}>
              <div className="flex justify-between text-xs mb-2">
                <span style={{ color: '#94a3b8' }} className="font-semibold">{s.label}</span>
                <span className="font-bold" style={{ color: '#4f6ef7' }}>
                  {s.fmt ? s.fmt(params[s.key]) : Number(params[s.key]).toFixed(2)}
                </span>
              </div>
              <input type="range" className="w-full"
                min={s.min} max={s.max} step={s.step} value={params[s.key]}
                onChange={e => handle(s.key, e.target.value)} />
            </div>
          ))}

          {/* Live demand display */}
          <div className="mt-4 rounded-2xl p-6 text-center"
            style={{ background: 'linear-gradient(135deg,rgba(79,110,247,0.12),rgba(124,92,191,0.12))',
              border: '1px solid rgba(79,110,247,0.25)' }}>
            {loading
              ? <Loader2 size={36} className="spin mx-auto" style={{ color: '#4f6ef7' }} />
              : <>
                  <p className="text-6xl font-black text-white">
                    {demand ?? '—'}
                  </p>
                  <p className="text-sm font-semibold mt-2" style={{ color: '#94a3b8' }}>Predicted Bikes</p>
                </>
            }
          </div>
        </div>

        {/* 24h chart */}
        <div className="rounded-xl p-4" style={{ background: '#1a1d2e', border: '1px solid #2a2d4a', minHeight: 260 }}>
          {loadingChart ? (
            <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: '#64748b' }}>
              <Loader2 size={32} className="spin" style={{ color: '#4f6ef7' }} />
              <p className="text-xs font-medium">Simulating 24 hours…</p>
            </div>
          ) : chartData.length > 0 ? (
            <>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#64748b' }}>
                Demand vs Hour of Day
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="hr" tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={v => `${v}h`} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine x={params.hr} stroke="rgba(124,92,191,0.6)" strokeDasharray="4 3" />
                  <Line type="monotone" dataKey="demand" stroke="#4f6ef7" strokeWidth={2.5}
                    dot={false} activeDot={{ r: 5, fill: '#4f6ef7', strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2" style={{ color: '#4a5568' }}>
              <p className="text-sm font-medium">Click "View 24h Curve" to simulate hourly demand</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
