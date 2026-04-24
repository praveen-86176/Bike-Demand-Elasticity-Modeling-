import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi, saveAuth } from '../api';
import logo from '../logo.png';

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const response = await authApi.register(form.name, form.email, form.password);
      saveAuth(response);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const strength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : 3;
  const strengthColors = ['', '#ff5050', '#ffb400', '#7EE63B'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Strong'];

  return (
    <div className="auth-page">
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 90% 10%, rgba(126,230,59,0.08) 0%, transparent 40%), radial-gradient(circle at 10% 90%, rgba(126,230,59,0.05) 0%, transparent 40%)' }} />
      <div className="topo-bg" style={{ opacity: 0.6 }} />
      <div style={{ position: 'absolute', left: '-10%', top: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(126,230,59,0.04) 0%, transparent 70%)', filter: 'blur(60px)' }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1100, margin: '0 auto 48px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={logo} alt="Logo" className="brand-logo" style={{ height: '36px', width: '36px' }} />
            <span style={{ fontWeight: 700, fontSize: 16 }}>ElasticityAI</span>
          </Link>
          <Link to="/login" style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Already have an account? <span style={{ color: 'var(--green)', fontWeight: 600 }}>Sign in</span>
          </Link>
        </div>

        <div className="auth-card" style={{ margin: '0 auto' }}>
          <div style={{ width: 52, height: 52, background: 'rgba(126,230,59,0.12)', border: '1px solid rgba(126,230,59,0.25)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 24 }}>
            🚴
          </div>

          <h1>Create account</h1>
          <p className="subtitle">Start your journey with ElasticityAI today</p>

          {error && (
            <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.25)', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#ff6b6b', marginBottom: 20 }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input id="signup-name" className="form-input" type="text" placeholder="John Doe"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input id="signup-email" className="form-input" type="email" placeholder="you@example.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input id="signup-password" className="form-input" type="password" placeholder="••••••••"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
              {form.password.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[1, 2, 3].map(i => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= strength ? strengthColors[strength] : 'var(--bg3)' }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 12, color: strengthColors[strength], fontWeight: 600 }}>{strengthLabels[strength]}</span>
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input id="signup-confirm" className="form-input" type="password" placeholder="••••••••"
                value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} required />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <input id="tos" type="checkbox" required style={{ accentColor: 'var(--green)', width: 16, height: 16 }} />
              <label htmlFor="tos" style={{ fontSize: 14, color: 'var(--text-muted)', cursor: 'pointer' }}>I agree to the Terms & Privacy</label>
            </div>

            <button id="signup-submit" className="form-submit" type="submit" disabled={loading}>
              {loading ? '⏳ Creating...' : 'Create account →'}
            </button>
          </form>



          <div className="auth-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
