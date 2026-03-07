import { Heart, Activity, Droplets, Wind, Weight, Share2, RefreshCw, Target } from 'lucide-react';
import { Card, Badge, Button, AnimatedPage, GradientHeader, StatRing } from '@/design-system';

/* ── Sparkline helper ── */
function Sparkline({ data, color, width = 80, height = 24 }: { data: number[]; color: string; width?: number; height?: number }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-6" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Mock data ── */
const vitals = [
  {
    id: 'bp', label: 'Tension artérielle', icon: Heart, color: 'text-mc-red-500', hex: '#ef4444',
    current: '145/85', unit: 'mmHg', normalRange: '120/80 – 140/90',
    status: 'elevated' as const, sparkData: [138, 140, 148, 142, 145, 140, 145],
    history: [
      { date: '06/03', time: '08:30', nurse: 'Marie L.', value: '145/85 mmHg' },
      { date: '05/03', time: '08:15', nurse: 'Marie L.', value: '140/82 mmHg' },
      { date: '04/03', time: '08:45', nurse: 'Sophie V.', value: '148/88 mmHg' },
      { date: '03/03', time: '08:30', nurse: 'Marie L.', value: '142/84 mmHg' },
      { date: '02/03', time: '08:20', nurse: 'Marie L.', value: '138/80 mmHg' },
    ],
  },
  {
    id: 'glycemia', label: 'Glycémie', icon: Droplets, color: 'text-mc-amber-500', hex: '#f59e0b',
    current: '142', unit: 'mg/dL', normalRange: '70 – 130 à jeun',
    status: 'elevated' as const, sparkData: [145, 138, 156, 142, 138, 142, 142],
    history: [
      { date: '06/03', time: '07:00', nurse: 'Marie L.', value: '142 mg/dL' },
      { date: '05/03', time: '07:15', nurse: 'Marie L.', value: '138 mg/dL' },
      { date: '04/03', time: '07:00', nurse: 'Sophie V.', value: '156 mg/dL' },
      { date: '03/03', time: '07:10', nurse: 'Marie L.', value: '145 mg/dL' },
    ],
  },
  {
    id: 'hr', label: 'Pouls', icon: Activity, color: 'text-mc-blue-500', hex: '#47B6FF',
    current: '78', unit: 'bpm', normalRange: '60 – 100',
    status: 'normal' as const, sparkData: [75, 78, 80, 76, 78, 75, 78],
    history: [
      { date: '06/03', time: '08:30', nurse: 'Marie L.', value: '78 bpm' },
      { date: '05/03', time: '08:15', nurse: 'Marie L.', value: '75 bpm' },
      { date: '04/03', time: '08:45', nurse: 'Sophie V.', value: '80 bpm' },
    ],
  },
  {
    id: 'spo2', label: 'Saturation O₂', icon: Wind, color: 'text-mc-green-500', hex: '#4ABD33',
    current: '97', unit: '%', normalRange: '95 – 100',
    status: 'normal' as const, sparkData: [96, 97, 98, 97, 96, 97, 97],
    history: [
      { date: '06/03', time: '08:30', nurse: 'Marie L.', value: '97%' },
      { date: '05/03', time: '08:15', nurse: 'Marie L.', value: '96%' },
    ],
  },
  {
    id: 'weight', label: 'Poids', icon: Weight, color: 'text-mc-blue-400', hex: '#60a5fa',
    current: '72.0', unit: 'kg', normalRange: 'IMC 18.5 – 25',
    status: 'normal' as const, sparkData: [72.5, 72.3, 72.0, 72.3, 72.0, 72.0, 72.0],
    history: [
      { date: '06/03', time: '08:30', nurse: 'Marie L.', value: '72.0 kg' },
      { date: '01/03', time: '08:00', nurse: 'Marie L.', value: '72.3 kg' },
    ],
  },
];

const statusBg = {
  normal: 'bg-mc-green-50 dark:bg-mc-green-900/15 border-mc-green-200 dark:border-mc-green-800',
  elevated: 'bg-mc-amber-50 dark:bg-amber-900/15 border-mc-amber-200 dark:border-amber-800',
  critical: 'bg-red-50 dark:bg-red-900/15 border-red-200 dark:border-red-800',
};
const statusLabel = { normal: 'Normal', elevated: 'Élevé', critical: 'Critique' };
const statusVariant = { normal: 'green' as const, elevated: 'amber' as const, critical: 'red' as const };

export function HealthPage() {
  return (
    <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <GradientHeader
        icon={<Heart className="h-5 w-5" />}
        title="Ma Santé"
        subtitle="Dernière mesure: 145/85 mmHg"
        badge={<Badge variant="amber">Attention</Badge>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">78</p>
            <p className="text-[10px] text-white/60">Pouls</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">142</p>
            <p className="text-[10px] text-white/60">Glycémie</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">72 kg</p>
            <p className="text-[10px] text-white/60">Poids</p>
          </div>
        </div>
      </GradientHeader>

      {/* ── Vitalink Sync + Share ── */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Vitalink sync — 06/03 08:30
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Share2 className="h-3.5 w-3.5" /> Envoyer au médecin
        </Button>
      </div>

      {/* ── Goal Tracking ── */}
      <Card className="flex items-center gap-4">
        <StatRing value={72} max={75} label="Poids" size={56} strokeWidth={4} />
        <div className="flex-1">
          <p className="text-sm font-bold">Objectif poids</p>
          <p className="text-xs text-[var(--text-muted)]">Cible: 70 kg · Actuel: 72 kg · Reste: 2 kg</p>
          <div className="flex items-center gap-1 mt-1">
            <Target className="h-3 w-3 text-mc-blue-500" />
            <span className="text-[10px] text-mc-blue-500 font-medium">96% vers l'objectif</span>
          </div>
        </div>
      </Card>

      {/* ── Vital Cards with Sparklines ── */}
      <div className="space-y-3">
        {vitals.map(v => (
          <Card key={v.id} className={`border ${statusBg[v.status]}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <v.icon className={`h-5 w-5 ${v.color}`} />
                <div>
                  <p className="text-sm font-bold">{v.label}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Norme: {v.normalRange}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-black">{v.current}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{v.unit}</p>
              </div>
            </div>

            {/* Sparkline */}
            <div className="mb-2">
              <Sparkline data={v.sparkData} color={v.hex} />
              <div className="flex justify-between text-[8px] text-[var(--text-muted)]">
                <span>7 jours</span>
                <Badge variant={statusVariant[v.status]}>{statusLabel[v.status]}</Badge>
              </div>
            </div>

            {/* Recent history */}
            <div className="space-y-1">
              {v.history.slice(0, 3).map((h, i) => (
                <div key={i} className="flex justify-between text-[10px] text-[var(--text-muted)]">
                  <span>{h.date} {h.time}</span>
                  <span className="font-medium text-[var(--text-primary)]">{h.value}</span>
                  <span>{h.nurse}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </AnimatedPage>
  );
}
