import { useState } from 'react';
import { Calculator, Info } from 'lucide-react';
import { Card, Badge, AnimatedPage, GradientHeader, Tabs } from '@/design-system';

const W_VALUE = 7.2511; // €/W for 2026

interface ForfaitRate { type: string; code: string; wValue: number; euroPerDay: number; description: string; }
const forfaits: ForfaitRate[] = [
  { type: 'PA', code: '425050', wValue: 1.657, euroPerDay: 12.01, description: 'Forfait A — toilette légère, soins d\'hygiène de base' },
  { type: 'PB', code: '425072', wValue: 3.314, euroPerDay: 24.03, description: 'Forfait B — toilette + préparation médicaments' },
  { type: 'PC', code: '425094', wValue: 6.210, euroPerDay: 45.03, description: 'Forfait C — soins infirmiers lourds + toilette' },
];

interface ActeRate { code: string; description: string; wValue: number; euro: number; }
const actes: ActeRate[] = [
  { code: '425110', description: 'Toilette complète', wValue: 1.657, euro: 12.01 },
  { code: '425375', description: 'Injection SC/IM', wValue: 0.829, euro: 6.01 },
  { code: '425434', description: 'Préparation médicaments', wValue: 0.496, euro: 3.60 },
  { code: '425596', description: 'Pansement simple', wValue: 0.829, euro: 6.01 },
  { code: '425611', description: 'Pansement complexe', wValue: 1.657, euro: 12.01 },
  { code: '425516', description: 'Suppl. dimanche/férié', wValue: 0.496, euro: 3.60 },
];

const tabs = [
  { id: 'calculator', label: 'Simulateur' },
  { id: 'comparison', label: 'Comparaison' },
  { id: 'projection', label: 'Projection' },
];

export function TariffSimulatorPage() {
  const [activeTab, setActiveTab] = useState('calculator');
  const [selectedForfait, setSelectedForfait] = useState<string>('PB');
  const [daysPerMonth, setDaysPerMonth] = useState(22);
  const [patientsCount, setPatientsCount] = useState(15);
  const [selectedActes, setSelectedActes] = useState<Record<string, number>>({
    '425110': 1,
    '425375': 1,
    '425434': 1,
  });

  const forfait = forfaits.find(f => f.type === selectedForfait)!;
  const forfaitMonthly = forfait.euroPerDay * daysPerMonth * patientsCount;

  const actesDaily = Object.entries(selectedActes).reduce((sum, [code, qty]) => {
    const acte = actes.find(a => a.code === code);
    return sum + (acte ? acte.euro * qty : 0);
  }, 0);
  const actesMonthly = actesDaily * daysPerMonth * patientsCount;

  const difference = forfaitMonthly - actesMonthly;
  const betterOption = difference > 0 ? 'forfait' : 'actes';

  function fmt(n: number) { return n.toLocaleString('fr-BE', { style: 'currency', currency: 'EUR' }); }

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<Calculator className="h-5 w-5" />}
        title="Simulateur tarifaire"
        subtitle="Forfait vs. actes — Projection revenus"
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{fmt(W_VALUE)}</p>
            <p className="text-[10px] text-white/60">Valeur W 2026</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-mc-green-300">{patientsCount}</p>
            <p className="text-[10px] text-white/60">Patients</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{daysPerMonth}j</p>
            <p className="text-[10px] text-white/60">/mois</p>
          </div>
        </div>
      </GradientHeader>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'calculator' && (
        <div className="space-y-4">
          {/* Parameters */}
          <Card>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">Paramètres</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[var(--text-muted)]">Jours/mois</label>
                <input
                  type="range" min={15} max={30} value={daysPerMonth}
                  onChange={e => setDaysPerMonth(Number(e.target.value))}
                  className="w-full mt-1 accent-[#47B6FF]"
                />
                <p className="text-sm font-bold text-center">{daysPerMonth}</p>
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)]">Patients</label>
                <input
                  type="range" min={1} max={50} value={patientsCount}
                  onChange={e => setPatientsCount(Number(e.target.value))}
                  className="w-full mt-1 accent-[#4ABD33]"
                />
                <p className="text-sm font-bold text-center">{patientsCount}</p>
              </div>
            </div>
          </Card>

          {/* Forfait selection */}
          <Card>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">Forfait</p>
            <div className="space-y-2">
              {forfaits.map(f => (
                <button
                  key={f.type}
                  onClick={() => setSelectedForfait(f.type)}
                  className={`w-full p-3 rounded-xl text-left transition-colors ${selectedForfait === f.type ? 'bg-mc-blue-500/10 ring-2 ring-mc-blue-500' : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{f.type} <span className="font-mono text-xs text-[var(--text-muted)]">({f.code})</span></p>
                      <p className="text-xs text-[var(--text-muted)]">{f.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{fmt(f.euroPerDay)}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">/jour</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Actes selection */}
          <Card>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">Actes isolés / jour</p>
            <div className="space-y-2">
              {actes.map(a => (
                <div key={a.code} className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-secondary)]">
                  <div>
                    <p className="text-sm font-mono">{a.code}</p>
                    <p className="text-xs text-[var(--text-muted)]">{a.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-muted)]">{fmt(a.euro)}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedActes(prev => {
                          const n = { ...prev };
                          if ((n[a.code] ?? 0) > 0) n[a.code] = (n[a.code] ?? 0) - 1;
                          if (n[a.code] === 0) delete n[a.code];
                          return n;
                        })}
                        className="w-6 h-6 rounded-full bg-[var(--bg-primary)] text-xs font-bold flex items-center justify-center"
                      >−</button>
                      <span className="w-6 text-center text-sm font-bold">{selectedActes[a.code] ?? 0}</span>
                      <button
                        onClick={() => setSelectedActes(prev => ({ ...prev, [a.code]: (prev[a.code] ?? 0) + 1 }))}
                        className="w-6 h-6 rounded-full bg-mc-blue-500 text-white text-xs font-bold flex items-center justify-center"
                      >+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'comparison' && (
        <div className="space-y-4">
          {/* Side by side */}
          <div className="grid grid-cols-2 gap-3">
            <Card className={`border-2 ${betterOption === 'forfait' ? 'border-mc-green-500' : 'border-transparent'}`}>
              <div className="text-center">
                {betterOption === 'forfait' && <Badge variant="green" className="mb-2">Optimal</Badge>}
                <p className="text-xs text-[var(--text-muted)] uppercase">Forfait {selectedForfait}</p>
                <p className="text-2xl font-bold mt-1">{fmt(forfaitMonthly)}</p>
                <p className="text-[10px] text-[var(--text-muted)]">/mois</p>
                <p className="text-xs mt-2">{fmt(forfait.euroPerDay)}/jour × {daysPerMonth}j × {patientsCount}p</p>
              </div>
            </Card>
            <Card className={`border-2 ${betterOption === 'actes' ? 'border-mc-green-500' : 'border-transparent'}`}>
              <div className="text-center">
                {betterOption === 'actes' && <Badge variant="green" className="mb-2">Optimal</Badge>}
                <p className="text-xs text-[var(--text-muted)] uppercase">Actes isolés</p>
                <p className="text-2xl font-bold mt-1">{fmt(actesMonthly)}</p>
                <p className="text-[10px] text-[var(--text-muted)]">/mois</p>
                <p className="text-xs mt-2">{fmt(actesDaily)}/jour × {daysPerMonth}j × {patientsCount}p</p>
              </div>
            </Card>
          </div>

          {/* Difference */}
          <Card className="text-center">
            <p className="text-xs text-[var(--text-muted)]">Différence mensuelle</p>
            <p className={`text-3xl font-bold ${difference > 0 ? 'text-mc-green-500' : 'text-mc-red-500'}`}>
              {difference > 0 ? '+' : ''}{fmt(Math.abs(difference))}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              en faveur du {betterOption === 'forfait' ? `forfait ${selectedForfait}` : 'régime actes isolés'}
            </p>
          </Card>
        </div>
      )}

      {activeTab === 'projection' && (
        <div className="space-y-4">
          <Card>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">Projection annuelle</p>
            <div className="space-y-3">
              {[3, 6, 12].map(months => (
                <div key={months} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]">
                  <div>
                    <p className="text-sm font-semibold">{months} mois</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Forfait {selectedForfait} vs Actes</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{fmt(forfaitMonthly * months)}</p>
                    <p className="text-xs text-[var(--text-muted)]">vs {fmt(actesMonthly * months)}</p>
                    <p className={`text-xs font-semibold ${difference > 0 ? 'text-mc-green-500' : 'text-mc-red-500'}`}>
                      {difference > 0 ? '+' : ''}{fmt(difference * months)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-mc-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Recommandation IA</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {betterOption === 'forfait'
                    ? `Le forfait ${selectedForfait} génère ${fmt(Math.abs(difference))}/mois de plus que les actes isolés. Pour ${patientsCount} patients avec le profil de soins sélectionné, le forfait est clairement avantageux.`
                    : `Les actes isolés génèrent ${fmt(Math.abs(difference))}/mois de plus que le forfait ${selectedForfait}. Évaluez si un changement de forfait ou un mix serait plus rentable.`
                  }
                </p>
              </div>
            </div>
          </Card>

          {/* Break-even */}
          <Card>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Seuil de rentabilité forfaitaire</p>
            <p className="text-xs text-[var(--text-muted)]">
              Le forfait {selectedForfait} devient rentable à partir de <strong>{Math.ceil(forfait.euroPerDay / actesDaily)} acte(s)/jour</strong> par patient.
            </p>
            <div className="mt-2 h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#47B6FF] to-[#4ABD33]"
                style={{ width: `${Math.min((actesDaily / forfait.euroPerDay) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1">
              <span>0 actes</span>
              <span>Seuil</span>
              <span>{fmt(forfait.euroPerDay)}</span>
            </div>
          </Card>
        </div>
      )}
    </AnimatedPage>
  );
}
