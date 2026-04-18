import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatCard({ label, value, icon, color = '#4f6ef7', trend, trendVal, suffix = '' }) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : '#94a3b8';

  return (
    <div className="bd-card relative overflow-hidden" style={{ borderLeft: `3px solid ${color}` }}>
      {/* Background accent */}
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-10"
        style={{ background: color }} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#64748b' }}>{label}</p>
          <p className="text-3xl font-extrabold text-white">
            {value ?? '—'}<span className="text-lg font-semibold ml-1" style={{ color: '#94a3b8' }}>{suffix}</span>
          </p>
          {trendVal !== undefined && (
            <div className="flex items-center gap-1.5 mt-2">
              <TrendIcon size={13} style={{ color: trendColor }} />
              <span className="text-xs font-semibold" style={{ color: trendColor }}>{trendVal}</span>
            </div>
          )}
        </div>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}1a` }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
    </div>
  );
}
