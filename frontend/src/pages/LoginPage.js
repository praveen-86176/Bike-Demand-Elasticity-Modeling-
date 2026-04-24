import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi, saveAuth } from '../api';
import logo from '../logo.png';

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await authApi.login(form.email, form.password);
      saveAuth(response);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 10% 10%, rgba(126,230,59,0.08) 0%, transparent 40%), radial-gradient(circle at 90% 90%, rgba(126,230,59,0.05) 0%, transparent 40%)' }} />
      <div className="topo-bg" style={{ opacity: 0.6 }} />
      <div style={{ position: 'absolute', right: '-10%', top: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(126,230,59,0.04) 0%, transparent 70%)', filter: 'blur(60px)' }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1100, margin: '0 auto 48px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={logo} alt="Logo" className="brand-logo" style={{ height: '36px', width: '36px' }} />
            <span style={{ fontWeight: 700, fontSize: 16 }}>ElasticityAI</span>
          </Link>
          <Link to="/signup" style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Don't have an account? <span style={{ color: 'var(--green)', fontWeight: 600 }}>Sign up</span>
          </Link>
        </div>

        <div className="auth-card" style={{ margin: '0 auto' }}>
          <div style={{ width: 52, height: 52, background: 'rgba(126,230,59,0.12)', border: '1px solid rgba(126,230,59,0.25)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 24 }}>
            🚴
          </div>

          <h1>Welcome back</h1>
          <p className="subtitle">Sign in to your ElasticityAI account to continue</p>

          {error && (
            <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.25)', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#ff6b6b', marginBottom: 20 }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                id="login-email"
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label className="form-label" style={{ margin: 0 }}>Password</label>
                <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 500, cursor: 'pointer' }}>Forgot password?</span>
              </div>
              <input
                id="login-password"
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <input id="remember" type="checkbox" style={{ accentColor: 'var(--green)', width: 16, height: 16 }} />
              <label htmlFor="remember" style={{ fontSize: 14, color: 'var(--text-muted)', cursor: 'pointer' }}>Remember me for 30 days</label>
            </div>

            <button id="login-submit" className="form-submit" type="submit" disabled={loading}>
              {loading ? '⏳ Signing in…' : 'Sign in →'}
            </button>
          </form>



          <div className="auth-link">
            New to ElasticityAI? <Link to="/signup">Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
