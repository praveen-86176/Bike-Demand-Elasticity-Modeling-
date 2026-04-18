import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bike, Mail, Lock, User, Loader2 } from 'lucide-react';

export default function SignUp() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return setError('Please fill in all fields.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true); setError('');
    await new Promise(r => setTimeout(r, 700));
    navigate('/signin');
  };

  const field = (key, label, type, icon, ph) => (
    <div>
      <label className="bd-label">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#4a5568' }}>{icon}</span>
        <input className="bd-input !pl-10" type={type} placeholder={ph}
          value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#0f1117',
        backgroundImage: 'radial-gradient(ellipse at 30% 30%, rgba(79,110,247,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(124,92,191,0.06) 0%, transparent 60%)' }}>

      <div className="w-full max-w-[420px] fade-in">
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg,#4f6ef7,#7c5cbf)', boxShadow: '0 0 30px rgba(79,110,247,0.4)' }}>
            <Bike size={26} color="#fff" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Create Account</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>Join BikeDemand AI Studio</p>
        </div>

        <div className="bd-card !p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {field('name',    'Full Name',        'text',     <User size={15} />, 'Jane Doe')}
            {field('email',   'Email Address',    'email',    <Mail size={15} />, 'you@example.com')}
            {field('password','Password',         'password', <Lock size={15} />, '••••••••')}
            {field('confirm', 'Confirm Password', 'password', <Lock size={15} />, '••••••••')}

            {error && (
              <div className="text-xs font-semibold px-4 py-3 rounded-xl"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                {error}
              </div>
            )}

            <button type="submit" className="bd-btn w-full py-3 mt-2" disabled={loading}>
              {loading ? <Loader2 size={16} className="spin" /> : null}
              {loading ? 'Creating…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#64748b' }}>
            Already have an account?{' '}
            <Link to="/signin" className="font-semibold" style={{ color: '#4f6ef7' }}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
