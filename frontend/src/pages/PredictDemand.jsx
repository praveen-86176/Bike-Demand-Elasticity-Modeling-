import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { predict } from '../api/api';
import { Bike, Loader2, AlertCircle, Zap } from 'lucide-react';

const WEATHER_MAP = { 1: 'Clear', 2: 'Mist/Cloudy', 3: 'Light Rain/Snow', 4: 'Heavy Rain/Fog' };
const SEASON_MAP  = { 1: 'Spring', 2: 'Summer', 3: 'Fall', 4: 'Winter' };

function demandLevel(v) {
  if (v === null) return null;
  if (v < 100)  return { label: 'Low',       color: '#22c55e', bar: 15, tip: 'Low demand. Standard fleet is sufficient.' };
  if (v < 300)  return { label: 'Medium',     color: '#f59e0b', bar: 40, tip: 'Moderate demand expected. Monitor closely.' };
  if (v < 600)  return { label: 'High',       color: '#4f6ef7', bar: 70, tip: 'High demand! Consider deploying more bikes.' };
  return              { label: 'Very High',   color: '#ef4444', bar: 95, tip: 'Extremely high demand. Maximum deployment recommended.' };
}

const Toggle = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium" style={{ color: '#94a3b8' }}>{label}</span>
    <label className="bd-toggle">
      <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked ? 1 : 0)} />
      <div className="bd-toggle-track" />
      <div className="bd-toggle-thumb" />
    </label>
  </div>
);

const SliderInput = ({ label, name, min, max, step, value, onChange, fmt }) => (
  <div>
    <div className="flex justify-between text-xs mb-2">
      <span className="font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>{label}</span>
      <span className="font-bold" style={{ color: '#4f6ef7' }}>{fmt ? fmt(value) : Number(value).toFixed(2)}</span>
    </div>
    <input type="range" className="w-full" min={min} max={max} step={step} value={value}
      onChange={e => onChange(parseFloat(e.target.value))} />
  </div>
);

const SelectInput = ({ label, name, options, value, onChange }) => (
  <div>
    <label className="bd-label">{label}</label>
    <select className="bd-input" value={value} onChange={e => onChange(parseInt(e.target.value))}>
      {Object.entries(options).map(([v, l]) => (
        <option key={v} value={v}>{l}</option>
      ))}
    </select>
  </div>
);

export default function PredictDemand() {
  const [form, setForm] = useState({
    season: 1, hr: 8, holiday: 0, workingday: 1, weathersit: 1,
    temp: 0.5, atemp: 0.5, hum: 0.5, windspeed: 0.2, mnth: 6, weekday: 1
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  const handlePredict = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const { data } = await predict(form);
      setResult(data.predicted_demand);
    } catch (e) {
      setError(e.response?.data?.detail || 'Prediction failed. Make sure a model is trained.');
    } finally { setLoading(false); }
  };

  const level = demandLevel(result);

  return (
    <div className="flex min-h-screen" style={{ background: '#0f1117' }}>
      <Sidebar />
      <main className="flex-1 ml-60 p-8 max-w-[1200px]">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-white">Predict Demand</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>
            Configure environmental conditions to forecast bike demand.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Form */}
          <div className="xl:col-span-2 space-y-5">

            {/* Dropdowns */}
            <div className="bd-card">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-5" style={{ color: '#4f6ef7' }}>
                Categorical Signals
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <SelectInput label="Season" options={SEASON_MAP}  value={form.season}     onChange={set('season')} />
                <SelectInput label="Month (1–12)" options={Object.fromEntries(Array.from({length:12},(_,i)=>[i+1,`Month ${i+1}`]))}
                  value={form.mnth} onChange={set('mnth')} />
                <SelectInput label="Weather" options={WEATHER_MAP} value={form.weathersit} onChange={set('weathersit')} />
                <SelectInput label="Weekday (0=Sun)" options={Object.fromEntries(Array.from({length:7},(_,i)=>[i,['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][i]]))}
                  value={form.weekday} onChange={set('weekday')} />
              </div>
            </div>

            {/* Toggles */}
            <div className="bd-card">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-5" style={{ color: '#4f6ef7' }}>
                Day Context
              </h3>
              <div className="space-y-4">
                <Toggle label="Working Day" value={form.workingday} onChange={set('workingday')} />
                <Toggle label="Public Holiday" value={form.holiday}    onChange={set('holiday')} />
              </div>
            </div>

            {/* Sliders */}
            <div className="bd-card">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-5" style={{ color: '#4f6ef7' }}>
                Environmental &amp; Temporal
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                <SliderInput label="Hour of Day" min={0} max={23} step={1}
                  value={form.hr} onChange={set('hr')} fmt={v => `${v}:00`} />
                <SliderInput label="Temperature (0–1)" min={0} max={1} step={0.01}
                  value={form.temp} onChange={set('temp')} />
                <SliderInput label="Feels-Like Temp" min={0} max={1} step={0.01}
                  value={form.atemp} onChange={set('atemp')} />
                <SliderInput label="Humidity (0–1)" min={0} max={1} step={0.01}
                  value={form.hum} onChange={set('hum')} />
                <SliderInput label="Windspeed (0–1)" min={0} max={1} step={0.01}
                  value={form.windspeed} onChange={set('windspeed')} />
              </div>
            </div>

            <button className="bd-btn w-full py-4 text-base" onClick={handlePredict} disabled={loading}>
              {loading ? <Loader2 size={18} className="spin" /> : <Zap size={18} />}
              {loading ? 'Predicting…' : 'Predict Demand'}
            </button>

            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" /> {error}
              </div>
            )}
          </div>

          {/* Result panel */}
          <div className="bd-card flex flex-col items-center justify-center min-h-[500px] text-center"
            style={{ background: 'linear-gradient(160deg, #141630 0%, #1e2139 100%)', borderColor: '#2a2d4a' }}>

            {loading && (
              <div className="flex flex-col items-center gap-4">
                <Loader2 size={48} className="spin" style={{ color: '#4f6ef7' }} />
                <p style={{ color: '#64748b' }}>Running inference…</p>
              </div>
            )}

            {!loading && result === null && !error && (
              <div className="flex flex-col items-center gap-4" style={{ color: '#2a2d4a' }}>
                <Bike size={64} className="opacity-40" />
                <p className="text-sm font-semibold" style={{ color: '#4a5568' }}>
                  Configure signals<br />and hit <span style={{ color: '#4f6ef7' }}>Predict Demand</span>
                </p>
              </div>
            )}

            {result !== null && !loading && (
              <div className="w-full fade-in">
                {/* Big number */}
                <div className="mb-6">
                  <Bike size={40} className="mx-auto mb-3" style={{ color: '#4f6ef7' }} />
                  <p className="text-7xl font-black text-white" style={{ letterSpacing: '-2px' }}>{result}</p>
                  <p className="text-sm font-semibold mt-2" style={{ color: '#64748b' }}>Predicted Bicycles</p>
                </div>

                {/* Demand level badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm mb-4"
                  style={{ background: `${level.color}18`, color: level.color, border: `1px solid ${level.color}4a` }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: level.color }} />
                  {level.label} Demand
                </div>

                {/* Bar */}
                <div className="w-full px-2 mb-4">
                  <div className="flex justify-between text-xs mb-1.5" style={{ color: '#4a5568' }}>
                    <span>Low</span><span>Medium</span><span>High</span><span>Very High</span>
                  </div>
                  <div className="w-full h-3 rounded-full" style={{ background: '#2a2d4a' }}>
                    <div className="h-3 rounded-full transition-all duration-700"
                      style={{ width: `${level.bar}%`, background: `linear-gradient(90deg, #4f6ef7, ${level.color})` }} />
                  </div>
                </div>

                {/* Tip */}
                <p className="text-sm px-2" style={{ color: '#94a3b8' }}>{level.tip}</p>

                {/* Context row */}
                <div className="mt-6 pt-5 border-t w-full text-xs grid grid-cols-2 gap-2 text-left"
                  style={{ borderColor: '#2a2d4a', color: '#64748b' }}>
                  <span>Season: <strong style={{ color: '#94a3b8' }}>{SEASON_MAP[form.season]}</strong></span>
                  <span>Hour: <strong style={{ color: '#94a3b8' }}>{form.hr}:00</strong></span>
                  <span>Weather: <strong style={{ color: '#94a3b8' }}>{WEATHER_MAP[form.weathersit]}</strong></span>
                  <span>Temp: <strong style={{ color: '#94a3b8' }}>{form.temp}</strong></span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
