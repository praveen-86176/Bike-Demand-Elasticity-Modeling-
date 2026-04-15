import React, { useState, useEffect } from 'react';
import { Bike, Activity, Brain, History, UploadCloud, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import './index.css';

const API_BASE = 'http://127.0.0.1:8000';

export default function App() {
  const [activeTab, setActiveTab] = useState('predict');

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 flex items-center justify-between px-8 py-5 border-b border-border bg-background/80 backdrop-blur-xl">
        <h1 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
          <Bike className="text-primary" size={28} /> Elasticity Studio
        </h1>
        <nav className="flex gap-2">
          <button className={`nav-btn ${activeTab === 'predict' ? 'active' : ''}`} onClick={() => setActiveTab('predict')}>
            <Activity size={18} /> Predict
          </button>
          <button className={`nav-btn ${activeTab === 'train' ? 'active' : ''}`} onClick={() => setActiveTab('train')}>
            <Brain size={18} /> Train Model
          </button>
          <button className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            <History size={18} /> History
          </button>
        </nav>
      </header>

      <main className="flex-1 w-full max-w-6xl p-8 mx-auto xl:px-0">
        {activeTab === 'predict' && <PredictModule />}
        {activeTab === 'train' && <TrainModule />}
        {activeTab === 'history' && <HistoryModule />}
      </main>
    </div>
  );
}

function PredictModule() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    season: 1, hr: 8, holiday: 0, workingday: 1, weathersit: 1,
    temp: 0.5, atemp: 0.5, hum: 0.5, windspeed: 0.2, mnth: 6, weekday: 1
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: parseFloat(e.target.value) });

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error(await res.text() || 'Prediction Failed');
      const data = await res.json();
      setResult(data.predicted_demand);
    } catch (err) {
      setError(err.message.includes('No trained model') ? "No Model Found! Please train the pipeline first." : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="mb-8 text-2xl font-bold">Real-time Inference</h2>
      <form onSubmit={handlePredict} className="space-y-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <InputGroup label="Temp (0-1)" name="temp" type="number" step="0.01" value={form.temp} onChange={handleChange} />
          <InputGroup label="ATemp (0-1)" name="atemp" type="number" step="0.01" value={form.atemp} onChange={handleChange} />
          <InputGroup label="Humidity (0-1)" name="hum" type="number" step="0.01" value={form.hum} onChange={handleChange} />
          <InputGroup label="Windspeed (0-1)" name="windspeed" type="number" step="0.01" value={form.windspeed} onChange={handleChange} />
          <InputGroup label="Season (1-4)" name="season" type="number" min="1" max="4" value={form.season} onChange={handleChange} />
          <InputGroup label="Weather (1-4)" name="weathersit" type="number" min="1" max="4" value={form.weathersit} onChange={handleChange} />
          <InputGroup label="Hour (0-23)" name="hr" type="number" min="0" max="23" value={form.hr} onChange={handleChange} />
          <InputGroup label="Month (1-12)" name="mnth" type="number" min="1" max="12" value={form.mnth} onChange={handleChange} />
          <InputGroup label="Weekday (0-6)" name="weekday" type="number" min="0" max="6" value={form.weekday} onChange={handleChange} />
          
          <div>
            <label className="input-label">Working Day</label>
            <select className="input-field" name="workingday" value={form.workingday} onChange={handleChange}>
              <option value={1}>Yes</option>
              <option value={0}>No</option>
            </select>
          </div>
          <div>
            <label className="input-label">Holiday</label>
            <select className="input-field" name="holiday" value={form.holiday} onChange={handleChange}>
              <option value={1}>Yes</option>
              <option value={0}>No</option>
            </select>
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <Activity />} Predict Demand
        </button>
      </form>

      {error && <div className="mt-6 text-center text-red-500 font-medium">{error}</div>}
      
      {result !== null && (
        <div className="mt-8 p-8 border border-green-500/30 bg-green-500/5 rounded-xl text-center">
          <h3 className="text-xl text-green-400 font-semibold mb-2">Estimated Hourly Rentals</h3>
          <div className="text-6xl font-black text-primary flex items-baseline justify-center gap-2">
            {result} <span className="text-2xl text-gray-400 font-medium">bikes</span>
          </div>
        </div>
      )}
    </div>
  );
}

function TrainModule() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleTrain = async () => {
    if (!file) return setError('Please select a dataset (hour.csv)');
    setLoading(true); setError(''); setResult(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/train`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Training Failed');
      setResult(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const chartData = result ? Object.entries(result.feature_importance)
    .map(([name, score]) => ({ name, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8) : [];

  return (
    <div className="glass-card animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="mb-2 text-2xl font-bold">Model Training Studio</h2>
      <p className="mb-8 text-gray-400">Upload the UCI dataset (hour.csv) to retrain the Random Forest pipeline.</p>

      <label className="flex flex-col items-center justify-center p-12 mb-8 border-2 border-dashed rounded-xl border-border hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group">
        <input type="file" className="hidden" accept=".csv" onChange={(e) => setFile(e.target.files[0])} />
        <UploadCloud className="w-16 h-16 mb-4 text-gray-500 group-hover:text-primary transition-colors" />
        <strong className="text-lg text-white">{file ? file.name : 'Click or Drag CSV here'}</strong>
      </label>

      <button className="btn-primary" onClick={handleTrain} disabled={loading || !file}>
        {loading ? <><Loader2 className="animate-spin" /> Training Pipeline...</> : <><Brain /> Commence Training</>}
      </button>

      {error && <div className="mt-6 text-center text-red-500 font-medium">{error}</div>}

      {result && (
        <div className="mt-12 animate-in fade-in zoom-in-95 duration-500">
          <div className="flex items-center gap-4 mb-8">
            <h3 className="text-2xl font-bold">Training Complete</h3>
            <span className="px-3 py-1 text-sm font-bold tracking-widest text-primary bg-primary/10 rounded-full">RUN #{result.run_id}</span>
          </div>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-10">
            <MetricCard label="R² Score" value={result.r2_score.toFixed(4)} />
            <MetricCard label="RMSE" value={result.rmse.toFixed(2)} />
            <MetricCard label="MAE" value={result.mae.toFixed(2)} />
          </div>

          <h4 className="text-lg font-semibold text-gray-300 mb-6">Permutation Importance</h4>
          <div className="h-72 w-full p-4 border border-border bg-black/20 rounded-xl">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#8b949e'}} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px', color: '#fff'}} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#58a6ff' : '#3178c6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryModule() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/runs`)
      .then(res => res.json())
      .then(data => { setRuns(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  if (loading) return <div className="flex justify-center mt-20"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>;

  return (
    <div className="glass-card animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="mb-6 text-2xl font-bold">Historical Database</h2>
      
      {runs.length === 0 ? (
        <p className="text-gray-400">No training runs recorded yet. Head over to the Train Model tab!</p>
      ) : (
        <div className="w-full overflow-x-auto border border-border rounded-xl">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-black/40 text-gray-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-5 font-semibold">Run ID</th>
                <th className="p-5 font-semibold">Date</th>
                <th className="p-5 font-semibold">R² Score</th>
                <th className="p-5 font-semibold">RMSE</th>
                <th className="p-5 font-semibold">MAE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {runs.map(run => (
                <tr key={run.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-5"><span className="px-3 py-1 text-xs font-bold text-primary bg-primary/10 rounded-full">#{run.id}</span></td>
                  <td className="p-5 text-gray-300">{new Date(run.created_at).toLocaleString()}</td>
                  <td className="p-5 text-primary font-semibold">{run.r2_score.toFixed(4)}</td>
                  <td className="p-5 text-gray-300">{run.rmse.toFixed(2)}</td>
                  <td className="p-5 text-gray-300">{run.mae.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Helper Components
const InputGroup = ({ label, ...props }) => (
  <div>
    <label className="input-label">{label}</label>
    <input className="input-field" required {...props} />
  </div>
);

const MetricCard = ({ label, value }) => (
  <div className="p-6 text-center border border-border bg-black/20 rounded-xl">
    <div className="text-4xl font-extrabold text-white mb-2">{value}</div>
    <div className="text-xs font-bold tracking-widest text-gray-500 uppercase">{label}</div>
  </div>
);
