import React, { useState, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import FeatureImportanceChart from '../components/FeatureImportanceChart';
import { trainModel } from '../api/api';
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';

const ALL_FEATURES = ['season','hr','holiday','workingday','weathersit','temp','atemp','hum','windspeed','mnth','weekday'];

export default function TrainModel() {
  const [file, setFile]           = useState(null);
  const [dragging, setDragging]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState('');
  const [features, setFeatures]   = useState(new Set(ALL_FEATURES));
  const fileRef                   = useRef();

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith('.csv')) setFile(f); else setError('Please drop a .csv file.');
  };

  const toggleFeat = (f) => {
    const next = new Set(features);
    next.has(f) ? next.delete(f) : next.add(f);
    setFeatures(next);
  };

  const handleTrain = async () => {
    if (!file) return setError('Please select a CSV file.');
    setLoading(true); setError(''); setResult(null);
    try {
      const { data } = await trainModel(file);
      setResult(data);
    } catch (e) {
      setError(e.response?.data?.detail || 'Training failed. Check the backend logs.');
    } finally { setLoading(false); }
  };

  const metric = (label, value, color, note) => (
    <div className="bd-card text-center" style={{ borderLeft: `3px solid ${color}` }}>
      <p className="text-3xl font-extrabold" style={{ color }}>{value ?? '—'}</p>
      <p className="text-xs font-bold uppercase tracking-wider mt-2" style={{ color: '#64748b' }}>{label}</p>
      {note && <p className="text-xs mt-1" style={{ color: note.ok ? '#22c55e' : '#ef4444' }}>{note.text}</p>}
    </div>
  );

  return (
    <div className="flex min-h-screen" style={{ background: '#0f1117' }}>
      <Sidebar />
      <main className="flex-1 ml-60 p-8 max-w-[1200px]">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-white">Train Model</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>Upload the UCI hour.csv to train or retrain the pipeline.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Upload */}
          <div className="xl:col-span-2 space-y-5">
            <div
              className="rounded-2xl flex flex-col items-center justify-center p-14 cursor-pointer transition-all"
              style={{
                border: `2px dashed ${dragging ? '#4f6ef7' : '#2a2d4a'}`,
                background: dragging ? 'rgba(79,110,247,0.06)' : '#1e2139',
              }}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current.click()}
            >
              <input ref={fileRef} type="file" accept=".csv" className="hidden"
                onChange={e => { setFile(e.target.files[0]); setError(''); }} />
              <UploadCloud size={48} className="mb-4"
                style={{ color: file ? '#22c55e' : dragging ? '#4f6ef7' : '#2a2d4a' }} />
              {file ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: '#22c55e' }} />
                  <span className="font-semibold text-white">{file.name}</span>
                  <button onClick={e => { e.stopPropagation(); setFile(null); }}
                    className="ml-2 p-1 rounded-full hover:bg-white/10 transition-colors">
                    <X size={14} style={{ color: '#94a3b8' }} />
                  </button>
                </div>
              ) : (
                <>
                  <p className="font-semibold text-white mb-1">Drop hour.csv here or click to browse</p>
                  <p className="text-xs" style={{ color: '#4a5568' }}>Accepts .csv files only</p>
                </>
              )}
            </div>

            <button className="bd-btn w-full py-4 text-base" onClick={handleTrain} disabled={loading || !file}>
              {loading ? <><Loader2 size={18} className="spin" /> Training pipeline — please wait…</> : 'Upload & Train Model'}
            </button>

            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" /> {error}
              </div>
            )}

            {loading && (
              <div className="bd-card text-center py-8">
                <Loader2 size={40} className="spin mx-auto mb-3" style={{ color: '#4f6ef7' }} />
                <p className="font-semibold text-white mb-1">Training in progress…</p>
                <p className="text-sm" style={{ color: '#64748b' }}>This may take 1–2 minutes for large datasets.</p>
              </div>
            )}

            {result && (
              <div className="fade-in space-y-5">
                {/* Success banner */}
                <div className="flex items-center gap-3 p-4 rounded-xl"
                  style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <CheckCircle2 size={20} style={{ color: '#22c55e' }} />
                  <div>
                    <p className="font-bold text-white">Model saved successfully</p>
                    <p className="text-sm" style={{ color: '#22c55e' }}>Run #{result.run_id} — {result.model_path}</p>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4">
                  {metric('RMSE', result.rmse?.toFixed(2), '#4f6ef7', { ok: result.rmse <= 45, text: result.rmse <= 45 ? '✓ Target ≤ 45 met' : '✗ Target ≤ 45 missed' })}
                  {metric('MAE',  result.mae?.toFixed(2),  '#7c5cbf', { ok: result.mae  <= 30, text: result.mae  <= 30 ? '✓ Target ≤ 30 met' : '✗ Target ≤ 30 missed' })}
                  {metric('R²',   result.r2_score?.toFixed(4), '#22c55e', { ok: result.r2_score >= 0.85, text: result.r2_score >= 0.85 ? '✓ Target ≥ 0.85 met' : '✗ Target ≥ 0.85 missed' })}
                </div>

                {/* Feature importance */}
                <div className="bd-card">
                  <FeatureImportanceChart data={result.feature_importance} title="Feature Importance — This Run" />
                </div>
              </div>
            )}
          </div>

          {/* Feature selector */}
          <div className="bd-card h-fit">
            <h3 className="text-base font-bold text-white mb-1">Feature Subset</h3>
            <p className="text-xs mb-5" style={{ color: '#64748b' }}>Select features to include in training.</p>
            <div className="space-y-2">
              {ALL_FEATURES.map(f => (
                <label key={f} className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={features.has(f)} onChange={() => toggleFeat(f)}
                    className="w-4 h-4 rounded cursor-pointer accent-primary" />
                  <span className="text-sm font-medium capitalize transition-colors"
                    style={{ color: features.has(f) ? '#e2e8f0' : '#4a5568' }}>
                    {f}
                  </span>
                </label>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t" style={{ borderColor: '#2a2d4a' }}>
              <p className="text-xs mb-3" style={{ color: '#64748b' }}>
                {features.size} / {ALL_FEATURES.length} features selected
              </p>
              <button className="bd-btn-ghost w-full text-xs !py-2.5"
                onClick={() => setFeatures(features.size === ALL_FEATURES.length ? new Set() : new Set(ALL_FEATURES))}>
                {features.size === ALL_FEATURES.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
