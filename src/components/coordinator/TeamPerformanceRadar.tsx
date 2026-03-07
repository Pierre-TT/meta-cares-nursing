import { useState } from 'react';
import { Card } from '@/design-system';

interface NursePerf {
  name: string;
  color: string;
  scores: number[]; // 0-100 for each axis
}

const axes = ['Ponctualité', 'Productivité', 'Satisfaction', 'Compliance', 'Continuité', 'Efficacité'];

const nurses: NursePerf[] = [
  { name: 'Marie Laurent', color: '#47B6FF', scores: [92, 88, 95, 90, 85, 91] },
  { name: 'Sophie Dupuis', color: '#4ABD33', scores: [78, 82, 88, 95, 90, 80] },
  { name: 'Thomas Maes', color: '#F59E0B', scores: [85, 70, 82, 88, 75, 78] },
  { name: 'Laura Van Damme', color: '#8B5CF6', scores: [90, 85, 90, 82, 88, 86] },
];

const cx = 120;
const cy = 120;
const maxR = 90;

function polarToXY(angle: number, r: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function buildPolygon(scores: number[]): string {
  return scores.map((s, i) => {
    const angle = (360 / scores.length) * i;
    const { x, y } = polarToXY(angle, (s / 100) * maxR);
    return `${x},${y}`;
  }).join(' ');
}

export function TeamPerformanceRadar() {
  const [selected, setSelected] = useState<Set<number>>(new Set([0, 1]));

  const toggle = (idx: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  return (
    <Card>
      <p className="text-sm font-bold mb-3">Radar de performance équipe</p>

      <div className="flex justify-center">
        <svg viewBox="0 0 240 240" className="w-56 h-56">
          {/* Grid circles */}
          {[20, 40, 60, 80, 100].map(pct => (
            <circle key={pct} cx={cx} cy={cy} r={(pct / 100) * maxR}
              fill="none" stroke="var(--border-primary)" strokeWidth="0.5" strokeDasharray={pct < 100 ? '2,2' : undefined} />
          ))}

          {/* Axis lines + labels */}
          {axes.map((label, i) => {
            const angle = (360 / axes.length) * i;
            const end = polarToXY(angle, maxR + 4);
            const labelPt = polarToXY(angle, maxR + 16);
            return (
              <g key={label}>
                <line x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="var(--border-primary)" strokeWidth="0.5" />
                <text x={labelPt.x} y={labelPt.y} textAnchor="middle" dominantBaseline="middle"
                  className="fill-[var(--text-muted)]" style={{ fontSize: '6px' }}>
                  {label}
                </text>
              </g>
            );
          })}

          {/* Nurse polygons */}
          {nurses.map((n, idx) => selected.has(idx) && (
            <polygon key={n.name} points={buildPolygon(n.scores)}
              fill={n.color + '20'} stroke={n.color} strokeWidth="1.5"
              style={{ transition: 'all 0.3s ease' }} />
          ))}
        </svg>
      </div>

      {/* Legend / toggles */}
      <div className="flex flex-wrap gap-2 mt-3 justify-center">
        {nurses.map((n, idx) => (
          <button key={n.name} onClick={() => toggle(idx)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium border transition-all ${
              selected.has(idx)
                ? 'border-transparent text-white'
                : 'border-[var(--border-primary)] text-[var(--text-muted)]'
            }`}
            style={selected.has(idx) ? { backgroundColor: n.color } : undefined}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: n.color }} />
            {n.name.split(' ')[0]}
          </button>
        ))}
      </div>
    </Card>
  );
}
