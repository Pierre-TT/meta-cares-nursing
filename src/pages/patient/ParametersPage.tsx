import { useState } from 'react';
import { Thermometer, Heart, Droplets, Wind, Weight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, Badge, AnimatedPage, ContentTabs, GradientHeader } from '@/design-system';

interface VitalRecord {
  date: string;
  time: string;
  nurse: string;
  value: number;
  unit: string;
}

interface VitalParam {
  id: string;
  label: string;
  icon: React.ReactNode;
  unit: string;
  normalRange: string;
  current: number;
  trend: 'up' | 'down' | 'stable';
  history: VitalRecord[];
}

const parameters: VitalParam[] = [
  {
    id: 'bp', label: 'Tension artérielle', icon: <Heart className="h-5 w-5 text-mc-red-500" />,
    unit: 'mmHg', normalRange: '120/80 – 140/90', current: 145, trend: 'up',
    history: [
      { date: '06/03', time: '08:30', nurse: 'Marie L.', value: 145, unit: '145/85 mmHg' },
      { date: '05/03', time: '08:15', nurse: 'Marie L.', value: 140, unit: '140/82 mmHg' },
      { date: '04/03', time: '08:45', nurse: 'Sophie V.', value: 148, unit: '148/88 mmHg' },
      { date: '03/03', time: '08:30', nurse: 'Marie L.', value: 142, unit: '142/84 mmHg' },
      { date: '02/03', time: '08:20', nurse: 'Marie L.', value: 138, unit: '138/80 mmHg' },
    ],
  },
  {
    id: 'glycemia', label: 'Glycémie', icon: <Droplets className="h-5 w-5 text-mc-amber-500" />,
    unit: 'mg/dL', normalRange: '70 – 130 à jeun', current: 142, trend: 'stable',
    history: [
      { date: '06/03', time: '07:00', nurse: 'Marie L.', value: 142, unit: 'mg/dL' },
      { date: '05/03', time: '07:15', nurse: 'Marie L.', value: 138, unit: 'mg/dL' },
      { date: '04/03', time: '07:00', nurse: 'Sophie V.', value: 156, unit: 'mg/dL' },
      { date: '03/03', time: '07:10', nurse: 'Marie L.', value: 145, unit: 'mg/dL' },
    ],
  },
  {
    id: 'temp', label: 'Température', icon: <Thermometer className="h-5 w-5 text-mc-blue-500" />,
    unit: '°C', normalRange: '36.1 – 37.2', current: 36.8, trend: 'stable',
    history: [
      { date: '06/03', time: '08:30', nurse: 'Marie L.', value: 36.8, unit: '°C' },
      { date: '05/03', time: '08:15', nurse: 'Marie L.', value: 36.6, unit: '°C' },
      { date: '04/03', time: '08:45', nurse: 'Sophie V.', value: 37.1, unit: '°C' },
    ],
  },
  {
    id: 'spo2', label: 'Saturation O₂', icon: <Wind className="h-5 w-5 text-mc-green-500" />,
    unit: '%', normalRange: '95 – 100', current: 97, trend: 'stable',
    history: [
      { date: '06/03', time: '08:30', nurse: 'Marie L.', value: 97, unit: '%' },
      { date: '05/03', time: '08:15', nurse: 'Marie L.', value: 96, unit: '%' },
      { date: '04/03', time: '08:45', nurse: 'Sophie V.', value: 98, unit: '%' },
    ],
  },
  {
    id: 'weight', label: 'Poids', icon: <Weight className="h-5 w-5 text-mc-blue-400" />,
    unit: 'kg', normalRange: 'IMC 18.5 – 25', current: 72, trend: 'stable',
    history: [
      { date: '06/03', time: '08:30', nurse: 'Marie L.', value: 72.0, unit: 'kg' },
      { date: '01/03', time: '08:00', nurse: 'Marie L.', value: 72.3, unit: 'kg' },
      { date: '22/02', time: '08:30', nurse: 'Sophie V.', value: 72.5, unit: 'kg' },
    ],
  },
];

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
  if (trend === 'up') return <TrendingUp className="h-4 w-4 text-mc-red-500" />;
  if (trend === 'down') return <TrendingDown className="h-4 w-4 text-mc-green-500" />;
  return <Minus className="h-4 w-4 text-[var(--text-muted)]" />;
};

export function ParametersPage() {
  const [selected, setSelected] = useState<string | null>(null);

  const tabs = [
    {
      id: 'overview',
      label: 'Aperçu',
      content: (
        <div className="space-y-3">
          {parameters.map(p => (
            <Card
              key={p.id}
              className="cursor-pointer hover:ring-2 hover:ring-mc-blue-500/30 transition-all"
              onClick={() => setSelected(selected === p.id ? null : p.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {p.icon}
                  <div>
                    <p className="font-medium">{p.label}</p>
                    <p className="text-xs text-[var(--text-muted)]">Norme: {p.normalRange}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{p.current}</span>
                  <span className="text-sm text-[var(--text-muted)]">{p.unit}</span>
                  <TrendIcon trend={p.trend} />
                </div>
              </div>

              {selected === p.id && (
                <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
                  <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Historique récent</p>
                  {p.history.map((h, i) => (
                    <div key={i} className="flex justify-between py-1 text-sm border-b border-[var(--border-subtle)] last:border-0">
                      <span className="text-[var(--text-muted)]">{h.date} {h.time}</span>
                      <span className="font-medium">{h.value} {h.unit !== h.value.toString() ? h.unit : ''}</span>
                      <span className="text-[var(--text-muted)]">{h.nurse}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      ),
    },
    {
      id: 'alerts',
      label: 'Alertes',
      content: (
        <div className="space-y-3">
          <Card className="border-l-4 border-l-mc-amber-500">
            <div className="flex items-start gap-3">
              <Heart className="h-5 w-5 text-mc-amber-500 mt-0.5" />
              <div>
                <p className="font-medium">Tension élevée</p>
                <p className="text-sm text-[var(--text-muted)]">
                  3 mesures consécutives au-dessus de 140/90 mmHg. Médecin traitant informé le 05/03.
                </p>
                <Badge variant="amber" className="mt-1">Suivi en cours</Badge>
              </div>
            </div>
          </Card>
          <Card className="border-l-4 border-l-mc-amber-500">
            <div className="flex items-start gap-3">
              <Droplets className="h-5 w-5 text-mc-amber-500 mt-0.5" />
              <div>
                <p className="font-medium">Glycémie à jeun limite</p>
                <p className="text-sm text-[var(--text-muted)]">
                  Valeur de 156 mg/dL le 04/03, au-dessus du seuil de 130 mg/dL.
                </p>
                <Badge variant="amber" className="mt-1">Ponctuel</Badge>
              </div>
            </div>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <GradientHeader
        icon={<Thermometer className="h-5 w-5" />}
        title="Mes Paramètres"
        subtitle="Mesures quotidiennes par votre infirmière"
        badge={<Badge variant="green">{parameters.length} paramètres</Badge>}
      />
      <ContentTabs tabs={tabs} />
    </AnimatedPage>
  );
}
