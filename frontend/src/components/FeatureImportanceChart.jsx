import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts';

const COLORS = ['#4f6ef7','#5d7df8','#6b8cf9','#7996f5','#8aa0f0','#98aae9','#a5b3e2','#b3bcd9'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1e2139', border: '1px solid #2a2d4a', borderRadius: 10, padding: '10px 16px' }}>
      <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 13 }}>{payload[0].payload.name}</p>
      <p style={{ color: '#4f6ef7', fontSize: 12, marginTop: 2 }}>
        Score: <strong>{Number(payload[0].value).toFixed(4)}</strong>
      </p>
    </div>
  );
};

export default function FeatureImportanceChart({ data, title = 'Top Demand Drivers' }) {
  if (!data) return (
    <div className="flex items-center justify-center h-48" style={{ color: '#4a5568' }}>
      No feature data available.
    </div>
  );

  const chartData = Object.entries(data)
    .map(([name, score]) => ({ name, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return (
    <div>
      <h3 className="text-base font-bold text-white mb-4">{title}</h3>
      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 60, left: 20, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis
              dataKey="name" type="category"
              tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
              axisLine={false} tickLine={false} width={90}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(79,110,247,0.06)' }} />
            <Bar dataKey="score" radius={[0, 6, 6, 0]} maxBarSize={28}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
              <LabelList dataKey="score" position="right"
                style={{ fill: '#94a3b8', fontSize: 11 }}
                formatter={v => Number(v).toFixed(3)} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
