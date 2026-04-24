import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { predictApi, runsApi, clearAuth, getUser, isLoggedIn } from '../api';
import logo from '../logo.png';

// ── Components ──
const Donut = ({ data }) => {
  const total = data.reduce((a, b) => a + b.value, 0);
  let cumulative = 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
      <svg width="160" height="160" viewBox="0 0 40 40">
        {data.map((s, i) => {
          const percent = (s.value / total) * 100;
          const offset = (cumulative / total) * 125.6;
          cumulative += s.value;
          return (
            <circle key={i} cx="20" cy="20" r="15.915" fill="transparent"
              stroke={s.color} strokeWidth="5" strokeDasharray={`${percent * 1.256} ${125.6 - percent * 1.256}`}
              strokeDashoffset={-offset} strokeLinecap="round" style={{ transition: 'all 0.6s ease' }}
            />
          );
        })}
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="white" style={{ fontSize: '4px', fontWeight: '800' }}>{total}</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {data.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: s.color }} />
            <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Constants ──
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SEASONS = [
  { label: 'Spring', value: 25, color: '#4CAF50' },
  { label: 'Summer', value: 35, color: '#FF9800' },
  { label: 'Fall', value: 20, color: '#FF5722' },
  { label: 'Winter', value: 20, color: '#2196F3' }
];
const AVAILABLE_FEATURES = ['season', 'mnth', 'hr', 'holiday', 'weekday', 'workingday', 'weathersit', 'temp', 'atemp', 'hum', 'windspeed'];
const FEATURE_LABELS = {
  season: 'Season', mnth: 'Month', hr: 'Hour', holiday: 'Holiday', weekday: 'Day of Week',
  workingday: 'Working Day', weathersit: 'Weather Condition', temp: 'Temperature',
  atemp: 'Feels-like Temp', hum: 'Humidity', windspeed: 'Wind Speed', yr: 'Year'
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [active, setActive] = useState('overview');
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ total_predictions: 0, latest_prediction: 0, total_training_runs: 0, best_r2: 0 });
  const [runs, setRuns] = useState([]);
  const [predHistory, setPredHistory] = useState([]);

  // Prediction State
  const [predForm, setPredForm] = useState({
    season: '1', hr: '12', holiday: '0', workingday: '1', weathersit: '1',
    temp: '0.5', atemp: '0.5', hum: '0.5', windspeed: '0.1', mnth: '1', weekday: '1', yr: '1'
  });
  const [prediction, setPrediction] = useState(null);
  const [predLoading, setPredLoading] = useState(false);
  const [predError, setPredError] = useState('');

  // Training State
  const [trainFile, setTrainFile] = useState(null);
  const [selectedFeatures, setSelectedFeatures] = useState(AVAILABLE_FEATURES);
  const [trainLoading, setTrainLoading] = useState(false);
  const [trainResult, setTrainResult] = useState(null);
  const [trainError, setTrainError] = useState('');

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    setUser(getUser());
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      const [s, r, h] = await Promise.all([predictApi.stats(), runsApi.list(), predictApi.history()]);
      setStats(s);
      setRuns(r);
      setPredHistory(h);
    } catch (err) { console.error('Failed to fetch stats:', err); }
  };

  const signOut = () => { clearAuth(); navigate('/'); };

  const handlePredict = async (e) => {
    e.preventDefault();
    setPredError('');
    setPredLoading(true);
    try {
      const res = await predictApi.predict(predForm);
      setPrediction(res);
      fetchDashboardData();
    } catch (err) { setPredError(err.message || 'Prediction failed'); }
    finally { setPredLoading(false); }
  };

  const handleTrain = async (e) => {
    e.preventDefault();
    if (!trainFile) { setTrainError('Please select a CSV file first'); return; }
    setTrainError('');
    setTrainLoading(true);
    try {
      const res = await runsApi.train(trainFile, selectedFeatures);
      setTrainResult(res);
      fetchDashboardData();
    } catch (err) { setTrainError(err.message || 'Training failed'); }
    finally { setTrainLoading(false); }
  };

  const toggleFeature = (feat) => {
    setSelectedFeatures(prev => prev.includes(feat) ? prev.filter(f => f !== feat) : [...prev, feat]);
  };

  const navItems = [
    { id: 'overview', icon: '📊', label: 'Overview' },
    { id: 'predict', icon: '🤖', label: 'Predict Demand' },
    { id: 'train', icon: '🏋️', label: 'Model Training' },
    { id: 'history', icon: '📋', label: 'Run History' },
    { id: 'analytics', icon: '📈', label: 'Analytics' },
  ];

  const initials = user ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'JD';

  // Get active model's dataset type
  const activeModelType = runs.length > 0 ? (runs[0].dataset_type || 'hourly') : 'hourly';

  return (
    <div className="dash-layout" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="topo-bg" style={{ opacity: 0.3 }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(126,230,59,0.03) 0%, transparent 70%)', filter: 'blur(100px)', pointerEvents: 'none' }} />
      
      <aside className="dash-sidebar">
        <div className="sidebar-logo">
          <img src={logo} alt="Logo" className="brand-logo" style={{ height: '36px', width: '36px', marginRight: '8px' }} />
          <span style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.5px' }}>ElasticityAI</span>
        </div>
        
        <nav className="sidebar-nav">
          <div className="sidebar-section">Main Dashboard</div>
          {navItems.map(n => (
            <div key={n.id} className={`sidebar-item ${active === n.id ? 'active' : ''}`} onClick={() => setActive(n.id)}>
              <span className="icon">{n.icon}</span>{n.label}
            </div>
          ))}
          
          <div className="sidebar-section" style={{ marginTop: '24px' }}>Account Settings</div>
          <div className="sidebar-item" onClick={signOut}>
            <span className="icon">🚪</span>Sign out
          </div>
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar">{initials}</div>
          <div style={{ overflow: 'hidden' }}>
            <div className="user-name">{user?.name || 'Loading...'}</div>
            <div className="user-role">Administrator</div>
          </div>
        </div>
      </aside>

      <main className="dash-content">
        {/* ── OVERVIEW ── */}
        {active === 'overview' && (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <div className="page-header">
              <h1>System Overview</h1>
              <p>Real-time demand forecasting and model performance metrics.</p>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
              {[
                { label: 'Total Predictions', val: stats.total_predictions, icon: '🎯', color: '#7EE63B' },
                { label: 'Latest Forecast', val: stats.latest_prediction || '—', icon: '🚲', color: '#fff' },
                { label: 'Active Models', val: stats.total_training_runs, icon: '🧠', color: '#2196F3' },
                { label: 'Best R² Accuracy', val: stats.best_r2 ? (stats.best_r2 * 100).toFixed(1) + '%' : '—', icon: '📈', color: '#FFB400' },
              ].map(s => (
                <div key={s.label} className="stat-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ width: '48px', height: '48px', background: s.color + '15', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: 'white' }}>{s.val}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', marginBottom: '40px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '32px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '800' }}>Hourly vs Daily Demand Trend</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-dim)' }}>Aggregated demand forecast visualization</p>
                  </div>
                  <span style={{ padding: '6px 12px', background: 'rgba(126,230,59,0.1)', borderRadius: '8px', fontSize: '11px', color: 'var(--green)', fontWeight: '800' }}>LIVE DATA</span>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '8px', minHeight: '180px', padding: '0 10px' }}>
                  {[45, 62, 58, 75, 90, 82, 68, 55, 42, 38, 52, 65].map((h, i) => (
                    <div key={i} style={{ flex: 1, position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                      <div style={{ height: `${h}%`, width: '100%', background: 'linear-gradient(180deg, var(--green) 0%, rgba(126,230,59,0.2) 100%)', borderRadius: '4px 4px 0 0', opacity: 0.8 }} />
                      <div style={{ fontSize: '9px', color: 'var(--text-dim)', textAlign: 'center', marginTop: '8px' }}>{i * 2}h</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chart-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '28px' }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '800' }}>Seasonal Distribution</h3>
                <p style={{ margin: '0 0 32px', fontSize: '13px', color: 'var(--text-dim)' }}>Demand across different seasons</p>
                <Donut data={SEASONS} />
              </div>
            </div>

            <div className="table-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', overflow: 'hidden' }}>
              <div style={{ padding: '28px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Recent Predictions Activity</h3>
                <button className="btn-green" style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: '700' }} onClick={() => setActive('predict')}>New Prediction</button>
              </div>
              <div style={{ padding: '0 12px 12px' }}>
                {predHistory.length === 0 ? (
                  <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-dim)' }}>No recent activity found.</div>
                ) : (
                  <table style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase' }}>ID</th>
                        <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Context</th>
                        <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Environmental Factors</th>
                        <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Predicted Demand</th>
                        <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Execution Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {predHistory.slice(0, 8).map(r => (
                        <tr key={r.id} style={{ background: 'rgba(255,255,255,0.02)', transition: 'background 0.2s' }}>
                          <td style={{ padding: '16px 20px', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px', fontWeight: '700', color: 'var(--green)' }}>#{r.id}</td>
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ fontWeight: '600', fontSize: '14px' }}>
                              {r.input_features?.hr != null ? `${r.input_features.hr}:00` : 'Daily Model'}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{['', 'Spring', 'Summer', 'Fall', 'Winter'][r.input_features?.season] ?? '—'} Season</div>
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', gap: '16px' }}>
                              <div>
                                <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Temperature</div>
                                <div style={{ fontSize: '13px', fontWeight: '600' }}>{r.input_features?.temp != null ? (r.input_features.temp * 41).toFixed(1) + '°C' : '—'}</div>
                              </div>
                              <div>
                                <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Humidity</div>
                                <div style={{ fontSize: '13px', fontWeight: '600' }}>{r.input_features?.hum != null ? (r.input_features.hum * 100).toFixed(0) + '%' : '—'}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '18px', fontWeight: '900', color: 'white' }}>{r.predicted_demand?.toLocaleString()}</span>
                              <span style={{ padding: '4px 8px', background: r.predicted_demand > 300 ? 'rgba(255,80,80,0.1)' : 'rgba(126,230,59,0.1)', borderRadius: '6px', fontSize: '10px', color: r.predicted_demand > 300 ? '#ff6b6b' : 'var(--green)', fontWeight: '800' }}>{r.predicted_demand > 300 ? 'HIGH' : 'STABLE'}</span>
                            </div>
                          </td>
                          <td style={{ padding: '16px 20px', borderTopRightRadius: '12px', borderBottomRightRadius: '12px', fontSize: '12px', color: 'var(--text-dim)' }}>{new Date(r.predicted_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── PREDICT ── */}
        {active === 'predict' && (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <div className="predict-form">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <h3>⚙️ Configure Prediction Parameters</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Using active model trained on <strong>{activeModelType.toUpperCase()}</strong> data.</p>
                </div>
                <div style={{ padding: '8px 16px', background: 'rgba(126,230,59,0.1)', border: '1px solid var(--green)', borderRadius: '12px', fontSize: '12px', color: 'var(--green)', fontWeight: '800' }}>
                  {activeModelType.toUpperCase()} MODE
                </div>
              </div>
              
              {predError && <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#ff6b6b', marginBottom: 16 }}>⚠️ {predError}</div>}
              
              <form onSubmit={handlePredict}>
                <div className="predict-grid">
                  {[
                    { id: 'season', label: 'Season', type: 'select', opts: [['1', 'Spring'], ['2', 'Summer'], ['3', 'Fall'], ['4', 'Winter']] },
                    { id: 'weathersit', label: 'Weather Situation', type: 'select', opts: [['1', 'Clear'], ['2', 'Cloudy'], ['3', 'Rainy'], ['4', 'Stormy']] },
                    { id: 'holiday', label: 'Is Holiday', type: 'select', opts: [['0', 'No'], ['1', 'Yes']] },
                    { id: 'workingday', label: 'Working Day', type: 'select', opts: [['1', 'Yes'], ['0', 'No']] },
                    { id: 'mnth', label: 'Month', type: 'select', opts: MONTHS.map((m, i) => [(i + 1).toString(), m]) },
                    { id: 'weekday', label: 'Day of Week', type: 'select', opts: [['0', 'Sunday'], ['1', 'Monday'], ['2', 'Tuesday'], ['3', 'Wednesday'], ['4', 'Thursday'], ['5', 'Friday'], ['6', 'Saturday']] },
                    { id: 'hr', label: 'Hour of Day (0–23)', type: 'number', min: 0, max: 23, hide: activeModelType === 'daily' },
                    { id: 'temp', label: 'Temperature (0–1)', type: 'number', min: 0, max: 1, step: 0.01 },
                    { id: 'hum', label: 'Humidity (0–1)', type: 'number', min: 0, max: 1, step: 0.01 },
                    { id: 'windspeed', label: 'Wind Speed (0–1)', type: 'number', min: 0, max: 1, step: 0.01 },
                  ].filter(f => !f.hide).map(f => (
                    <div key={f.id} className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">{f.label}</label>
                      {f.type === 'select' ? (
                        <select className="form-input" value={predForm[f.id]} onChange={e => setPredForm(p => ({ ...p, [f.id]: e.target.value }))} style={{ cursor: 'pointer' }}>
                          {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      ) : (
                        <input className="form-input" type="number" min={f.min} max={f.max} step={f.step || 1} value={predForm[f.id]} onChange={e => setPredForm(p => ({ ...p, [f.id]: e.target.value }))} />
                      )}
                    </div>
                  ))}
                </div>
                <button className="btn-green" type="submit" disabled={predLoading} style={{ marginTop: 24, fontSize: 15 }}>
                  {predLoading ? '⏳ Predicting…' : '🤖 Generate Prediction'}
                </button>
              </form>
            </div>

            {prediction && (
              <div className="predict-result" style={{ animation: 'slideUp 0.4s ease' }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Predicted Demand</div>
                  <div className="big">{prediction.predicted_demand?.toLocaleString()}</div>
                  <div className="desc">bike rentals · saved as prediction #{prediction.prediction_id}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>Model: {prediction.model_used} ({activeModelType})</div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <span className={`badge ${prediction.predicted_demand > 300 ? 'high' : 'med'}`}>
                    {prediction.predicted_demand > 300 ? '🔺 High Demand' : '➡️ Moderate'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TRAIN ── */}
        {active === 'train' && (
          <div className="predict-form" style={{ animation: 'fadeIn 0.4s ease' }}>
            <h3>⚙️ Model Training Engine</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>
              Upload <code>hour.csv</code> for hourly predictions or <code>day.csv</code> for daily predictions. 
              The system will automatically detect the dataset type.
            </p>

            {trainError && <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#ff6b6b', marginBottom: 20 }}>⚠️ {trainError}</div>}

            <form onSubmit={handleTrain}>
              <div style={{ background: 'var(--bg3)', borderRadius: '16px', padding: '32px', border: '1px dashed var(--border)', textAlign: 'center', marginBottom: '32px' }}>
                <input type="file" id="csv-upload" accept=".csv" style={{ display: 'none' }} onChange={e => setTrainFile(e.target.files[0])} />
                <label htmlFor="csv-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '56px', height: '56px', background: 'rgba(126, 230, 59, 0.1)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: 'var(--green)' }}>📁</div>
                  <div style={{ fontWeight: '700', fontSize: '16px' }}>{trainFile ? trainFile.name : 'Select Dataset'}</div>
                </label>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ marginBottom: '16px' }}>Feature Subset Selection</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
                  {AVAILABLE_FEATURES.map(feat => (
                    <div key={feat} onClick={() => toggleFeature(feat)} style={{
                      padding: '12px', borderRadius: '12px', fontSize: '13px', cursor: 'pointer',
                      border: '1px solid', borderColor: selectedFeatures.includes(feat) ? 'var(--green)' : 'rgba(255,255,255,0.08)',
                      background: selectedFeatures.includes(feat) ? 'rgba(126, 230, 59, 0.08)' : 'rgba(255,255,255,0.03)',
                      color: selectedFeatures.includes(feat) ? 'var(--green)' : 'var(--text-muted)',
                      transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                      <span>{FEATURE_LABELS[feat]}</span>
                      {selectedFeatures.includes(feat) && <span>✓</span>}
                    </div>
                  ))}
                </div>
              </div>

              <button className="btn-green" type="submit" disabled={trainLoading} style={{ marginTop: 32, width: '100%', height: '52px' }}>
                {trainLoading ? '⏳ Training Engine in Progress...' : '🏋️ Retrain Model'}
              </button>
            </form>

            {trainResult && (
              <div style={{ marginTop: '40px', padding: '32px', background: 'rgba(126, 230, 59, 0.03)', border: '1px solid rgba(126, 230, 59, 0.15)', borderRadius: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                  <h4 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>Training Successfully Completed</h4>
                  <span style={{ padding: '6px 12px', background: 'var(--green)', color: 'black', borderRadius: '8px', fontSize: '12px', fontWeight: '800' }}>NEW MODEL ACTIVE</span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' }}>
                  {[
                    { label: 'R² Accuracy', val: (trainResult.r2_score * 100).toFixed(1) + '%' },
                    { label: 'RMSE', val: trainResult.rmse.toFixed(2) },
                    { label: 'MAE', val: trainResult.mae.toFixed(2) },
                  ].map(m => (
                    <div key={m.label} style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>{m.label}</div>
                      <div style={{ fontSize: '28px', fontWeight: '900', color: 'white' }}>{m.val}</div>
                    </div>
                  ))}
                </div>

                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '16px' }}>
                  <h5 style={{ margin: '0 0 20px', fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Feature Importance</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {Object.entries(trainResult.feature_importance).sort(([, a], [, b]) => b - a).slice(0, 8).map(([name, val]) => (
                      <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ fontSize: '13px', width: '120px', color: 'var(--text-muted)' }}>{FEATURE_LABELS[name] || name}</span>
                        <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px' }}>
                          <div style={{ width: `${(val / Math.max(...Object.values(trainResult.feature_importance))) * 100}%`, height: '100%', background: 'var(--green)', borderRadius: '99px' }} />
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: '800', width: '40px', textAlign: 'right' }}>{(val * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── HISTORY ── */}
        {active === 'history' && (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <div className="page-header">
              <h1>Training History</h1>
              <p>Archived model performance across {runs.length} training runs</p>
            </div>
            <div className="table-card">
              <div style={{ padding: '0 16px 16px' }}>
                {runs.length === 0 ? (
                  <div style={{ padding: '60px 40px', textAlign: 'center' }}>
                    <div style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.5 }}>📋</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '6px' }}>No Training Runs Yet</div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>Upload a dataset and train your first model to see results here.</div>
                  </div>
                ) : (
                  <table>
                    <thead>
                      <tr><th>Run</th><th>Type</th><th>Performance</th><th>Features</th><th>Date</th></tr>
                    </thead>
                    <tbody>
                      {runs.map((r, i) => {
                        const r2 = (r.r2_score * 100);
                        const r2Color = r2 >= 90 ? '#7EE63B' : r2 >= 80 ? '#FFB400' : '#ff6b6b';
                        return (
                          <tr key={r.id} style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <td style={{ fontWeight: '800', color: '#7EE63B', fontSize: '14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {i === 0 && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7EE63B', boxShadow: '0 0 8px #7EE63B' }} />}
                                #{r.id}
                              </div>
                            </td>
                            <td>
                              <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', background: (r.dataset_type || 'hourly') === 'hourly' ? 'rgba(33,150,243,0.12)' : 'rgba(255,152,0,0.12)', color: (r.dataset_type || 'hourly') === 'hourly' ? '#64B5F6' : '#FFB74D' }}>
                                {r.dataset_type || 'hourly'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${r2Color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: r2Color }}>{r2.toFixed(0)}</div>
                                <div>
                                  <div style={{ fontSize: '13px', fontWeight: '700' }}>R² {r2.toFixed(1)}%</div>
                                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>RMSE {r.rmse?.toFixed(1)}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {r.features_used?.map(f => FEATURE_LABELS[f] || f).join(', ')}
                            </td>
                            <td style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── ANALYTICS ── */}
        {active === 'analytics' && (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '900' }}>Demand Analytics</h1>
              <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '14px' }}>Insights from {predHistory.length} predictions and {runs.length} training runs</p>
            </div>

            {/* Quick Insight Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
              {[
                { label: 'Avg Predicted Demand', val: predHistory.length ? Math.round(predHistory.reduce((a, p) => a + (p.predicted_demand || 0), 0) / predHistory.length) : '—', icon: '📊', color: '#7EE63B' },
                { label: 'Peak Demand Recorded', val: predHistory.length ? Math.max(...predHistory.map(p => p.predicted_demand || 0)).toLocaleString() : '—', icon: '🔺', color: '#FF9800' },
                { label: 'Model Accuracy (Best)', val: stats.best_r2 ? (stats.best_r2 * 100).toFixed(1) + '%' : '—', icon: '🎯', color: '#2196F3' },
              ].map(c => (
                <div key={c.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '20px' }}>{c.icon}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>{c.label}</span>
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: '900', color: c.color }}>{c.val}</div>
                </div>
              ))}
            </div>

            {/* Seasonal Demand Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '28px' }}>
                <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: '800' }}>Demand by Season</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {[
                    { name: 'Spring', key: 1, color: '#4CAF50', pct: 25 },
                    { name: 'Summer', key: 2, color: '#FF9800', pct: 40 },
                    { name: 'Fall', key: 3, color: '#FF5722', pct: 22 },
                    { name: 'Winter', key: 4, color: '#2196F3', pct: 13 },
                  ].map(s => {
                    const count = predHistory.filter(p => p.input_features?.season === s.key).length;
                    const barPct = predHistory.length ? (count / predHistory.length * 100) : s.pct;
                    return (
                      <div key={s.name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600' }}>{s.name}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{count || '—'} predictions</span>
                        </div>
                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ width: `${barPct}%`, height: '100%', background: s.color, borderRadius: '99px', transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '28px' }}>
                <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: '800' }}>Weather Impact Analysis</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {[
                    { name: 'Clear Sky', key: 1, emoji: '☀️', pct: 50 },
                    { name: 'Cloudy / Mist', key: 2, emoji: '☁️', pct: 30 },
                    { name: 'Light Rain', key: 3, emoji: '🌧️', pct: 15 },
                    { name: 'Heavy Storm', key: 4, emoji: '⛈️', pct: 5 },
                  ].map(w => {
                    const count = predHistory.filter(p => p.input_features?.weathersit === w.key).length;
                    const avg = predHistory.filter(p => p.input_features?.weathersit === w.key).reduce((a, p) => a + (p.predicted_demand || 0), 0) / (count || 1);
                    return (
                      <div key={w.name} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                        <span style={{ fontSize: '22px' }}>{w.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: '600' }}>{w.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{count} predictions</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--green)' }}>{count ? Math.round(avg) : '—'}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>avg demand</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Model Performance Over Time */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '28px', marginBottom: '28px' }}>
              <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '800' }}>Model Performance Over Training Runs</h3>
              <p style={{ margin: '0 0 24px', fontSize: '12px', color: 'var(--text-dim)' }}>R² accuracy across each training iteration</p>
              {runs.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>No training runs yet. Train a model to see performance trends.</div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '180px' }}>
                  {[...runs].reverse().map((r, i) => {
                    const pct = (r.r2_score || 0) * 100;
                    return (
                      <div key={r.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--green)', marginBottom: '4px' }}>{pct.toFixed(1)}%</div>
                        <div style={{ width: '100%', maxWidth: '48px', height: `${pct}%`, background: `linear-gradient(180deg, var(--green) 0%, rgba(126,230,59,0.3) 100%)`, borderRadius: '6px 6px 0 0', minHeight: '4px' }} />
                        <div style={{ fontSize: '9px', color: 'var(--text-dim)', marginTop: '6px' }}>Run #{r.id}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Hourly Demand Distribution */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '28px' }}>
              <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '800' }}>Hourly Demand Distribution</h3>
              <p style={{ margin: '0 0 24px', fontSize: '12px', color: 'var(--text-dim)' }}>Average predicted demand per hour from your prediction history</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '140px' }}>
                {Array.from({ length: 24 }, (_, hr) => {
                  const matching = predHistory.filter(p => p.input_features?.hr === hr);
                  const avg = matching.length ? matching.reduce((a, p) => a + (p.predicted_demand || 0), 0) / matching.length : 0;
                  const maxAvg = Math.max(...Array.from({ length: 24 }, (_, h) => {
                    const m = predHistory.filter(p => p.input_features?.hr === h);
                    return m.length ? m.reduce((a, p) => a + (p.predicted_demand || 0), 0) / m.length : 0;
                  }), 1);
                  return (
                    <div key={hr} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                      <div style={{ width: '100%', height: `${(avg / maxAvg) * 100}%`, background: avg > 0 ? 'var(--green)' : 'rgba(255,255,255,0.05)', borderRadius: '3px 3px 0 0', opacity: avg > 0 ? 0.7 : 0.3, minHeight: '2px' }} />
                      {hr % 3 === 0 && <div style={{ fontSize: '8px', color: 'var(--text-dim)', marginTop: '4px' }}>{hr}h</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

        .dash-layout { display: flex; min-height: 100vh; background: #060608; color: var(--text); font-family: 'Inter', sans-serif; }

        /* ── Sidebar ── */
        .dash-sidebar {
          width: 260px; min-width: 260px; position: fixed; height: 100vh; z-index: 100; overflow-y: auto;
          background: linear-gradient(180deg, #0d0d10 0%, #0a0a0d 100%);
          border-right: 1px solid rgba(126,230,59,0.06);
          padding: 28px 16px; display: flex; flex-direction: column;
        }
        .sidebar-logo { display: flex; align-items: center; margin-bottom: 36px; padding: 4px 10px; gap: 10px; }
        .sidebar-nav { flex: 1; }
        .sidebar-section { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.25); text-transform: uppercase; letter-spacing: 0.14em; margin-bottom: 10px; margin-top: 20px; padding: 0 14px; }
        .sidebar-item {
          display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 10px;
          cursor: pointer; color: rgba(255,255,255,0.45); font-size: 13.5px; font-weight: 600;
          transition: all 0.25s cubic-bezier(0.4,0,0.2,1); margin-bottom: 2px; position: relative;
        }
        .sidebar-item:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.8); }
        .sidebar-item.active {
          background: linear-gradient(135deg, rgba(126,230,59,0.12) 0%, rgba(126,230,59,0.06) 100%);
          color: #7EE63B; font-weight: 700;
          box-shadow: 0 0 20px rgba(126,230,59,0.06);
        }
        .sidebar-item.active::before {
          content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%);
          width: 3px; height: 20px; background: #7EE63B; border-radius: 0 4px 4px 0;
        }
        .sidebar-item .icon { font-size: 16px; width: 22px; text-align: center; }
        .sidebar-user {
          padding: 14px; border-top: 1px solid rgba(255,255,255,0.05); margin-top: 8px;
          display: flex; align-items: center; gap: 12px;
          background: rgba(255,255,255,0.02); border-radius: 12px;
        }
        .user-avatar {
          width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
          background: linear-gradient(135deg, #7EE63B 0%, #4CAF50 100%);
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 13px; color: black;
        }
        .user-name { font-size: 13px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .user-role { font-size: 10px; color: rgba(255,255,255,0.3); margin-top: 1px; letter-spacing: 0.02em; }

        /* ── Main Content ── */
        .dash-content { flex: 1; padding: 36px 44px; margin-left: 260px; min-height: 100vh; }

        /* ── Glass Card ── */
        .glass-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);
          border: 1px solid rgba(255,255,255,0.06); border-radius: 16px;
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        }

        /* ── Stat Cards ── */
        .stat-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%);
          border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 22px;
          display: flex; align-items: center; gap: 18px;
          transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
        }
        .stat-card:hover { transform: translateY(-3px); border-color: rgba(126,230,59,0.15); box-shadow: 0 12px 40px rgba(0,0,0,0.3), 0 0 20px rgba(126,230,59,0.04); }

        /* ── Forms ── */
        .predict-form {
          background: linear-gradient(135deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.01) 100%);
          border: 1px solid rgba(255,255,255,0.06); border-radius: 18px; padding: 28px; margin-bottom: 24px;
        }
        .predict-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }
        .form-group { margin-bottom: 14px; }
        .form-label { display: block; font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
        .form-input {
          width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; padding: 10px 14px; font-size: 14px; color: var(--text);
          transition: all 0.25s; box-sizing: border-box;
        }
        .form-input:focus { outline: none; border-color: rgba(126,230,59,0.5); box-shadow: 0 0 0 3px rgba(126,230,59,0.08), 0 0 16px rgba(126,230,59,0.06); }
        .form-input:hover { border-color: rgba(255,255,255,0.12); }
        select.form-input { appearance: auto; cursor: pointer; }

        /* ── Results ── */
        .predict-result {
          background: linear-gradient(135deg, rgba(126,230,59,0.08) 0%, rgba(126,230,59,0.02) 100%);
          border: 1px solid rgba(126,230,59,0.15); border-radius: 18px; padding: 28px;
          display: flex; align-items: center; margin-top: 20px;
        }
        .predict-result .big { font-size: 44px; font-weight: 900; color: #7EE63B; line-height: 1; margin-bottom: 4px; }
        .predict-result .desc { font-size: 12px; color: rgba(255,255,255,0.45); }

        /* ── Buttons ── */
        .btn-green {
          background: linear-gradient(135deg, #7EE63B 0%, #5CB82A 100%);
          color: black; border: none; padding: 12px 24px; border-radius: 10px;
          font-weight: 800; font-size: 13px; cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4,0,0.2,1); position: relative; overflow: hidden;
        }
        .btn-green:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(126,230,59,0.3); }
        .btn-green:active { transform: scale(0.98); }
        .btn-green:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }

        /* ── Tables ── */
        .table-card {
          background: linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.01) 100%);
          border: 1px solid rgba(255,255,255,0.06); border-radius: 18px; overflow: hidden;
        }
        table { width: 100%; border-collapse: separate; border-spacing: 0 4px; }
        th { padding: 12px 18px; color: rgba(255,255,255,0.3); font-size: 10px; font-weight: 700; text-transform: uppercase; text-align: left; letter-spacing: 0.08em; }
        td { padding: 14px 18px; }
        tr:hover td { background: rgba(126,230,59,0.03); }
        tr td:first-child { border-radius: 10px 0 0 10px; }
        tr td:last-child { border-radius: 0 10px 10px 0; }

        /* ── Badges ── */
        .badge { padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 800; letter-spacing: 0.04em; }
        .badge.high { background: rgba(255,80,80,0.1); color: #ff6b6b; }
        .badge.med { background: rgba(126,230,59,0.1); color: #7EE63B; }

        /* ── Page Header ── */
        .page-header { margin-bottom: 32px; }
        .page-header h1 { margin: 0 0 6px; font-size: 22px; font-weight: 900; letter-spacing: -0.02em; }
        .page-header p { margin: 0; color: rgba(255,255,255,0.35); font-size: 13px; }

        /* ── Chart cards ── */
        .chart-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);
          border: 1px solid rgba(255,255,255,0.06); border-radius: 18px; padding: 24px;
        }
      `}</style>
    </div>
  );
}
