import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bike, Mail, Lock, Loader2 } from 'lucide-react';

export default function SignIn() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return setError('Please fill in all fields.');
    setLoading(true); setError('');
    await new Promise(r => setTimeout(r, 700)); // simulate async
    localStorage.setItem('bd_token', btoa(form.email + ':' + Date.now()));
    localStorage.setItem('bd_user', JSON.stringify({ name: form.email.split('@')[0], email: form.email }));
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#0f1117',
        backgroundImage: 'radial-gradient(ellipse at 30% 30%, rgba(79,110,247,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(124,92,191,0.06) 0%, transparent 60%)' }}>

      <div className="w-full max-w-[400px] fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg,#4f6ef7,#7c5cbf)', boxShadow: '0 0 30px rgba(79,110,247,0.4)' }}>
            <Bike size={26} color="#fff" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">BikeDemand AI</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>Sign in to your account</p>
        </div>

        <div className="bd-card !p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="bd-label">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#4a5568' }} />
                <input className="bd-input !pl-10" type="email" placeholder="you@example.com"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="bd-label">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#4a5568' }} />
                <input className="bd-input !pl-10" type="password" placeholder="••••••••"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>
            </div>

            {error && (
              <div className="text-xs font-semibold px-4 py-3 rounded-xl"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                {error}
              </div>
            )}

            <button type="submit" className="bd-btn w-full py-3" disabled={loading}>
              {loading ? <Loader2 size={16} className="spin" /> : null}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#64748b' }}>
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold" style={{ color: '#4f6ef7' }}>Create one</Link>
          </p>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#374151' }}>
          Any email + password combination will work for demo.
        </p>
      </div>
    </div>
  );
}
