import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, UploadCloud, BarChart2,
  Clock, LogOut, Bike
} from 'lucide-react';

const links = [
  { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/train',     icon: <UploadCloud size={18} />,     label: 'Train Model' },
  { to: '/predict',   icon: <BarChart2 size={18} />,       label: 'Predict Demand' },
  { to: '/history',   icon: <Clock size={18} />,           label: 'History' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('bd_user') || '{}');

  const logout = () => {
    localStorage.removeItem('bd_token');
    localStorage.removeItem('bd_user');
    navigate('/signin');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 flex flex-col z-50"
      style={{ background: '#1a1d2e', borderRight: '1px solid #2a2d4a' }}>

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b" style={{ borderColor: '#2a2d4a' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#4f6ef7,#7c5cbf)' }}>
          <Bike size={18} color="#fff" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight">BikeDemand</p>
          <p className="text-xs font-medium" style={{ color: '#4f6ef7' }}>AI Studio</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {links.map(l => (
          <NavLink key={l.to} to={l.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            {l.icon}
            {l.label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-5 border-t space-y-3" style={{ borderColor: '#2a2d4a' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#7c5cbf,#4f6ef7)' }}>
            {(user.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user.name || 'User'}</p>
            <p className="text-xs truncate" style={{ color: '#64748b' }}>{user.email || ''}</p>
          </div>
        </div>
        <button onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
