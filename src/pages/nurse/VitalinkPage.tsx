import { useState } from 'react';
import { Pill, RefreshCw, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, Button, AnimatedPage, ContentTabs, GradientHeader } from '@/design-system';

/* ─── Vitalink Medication Schema ─── */
interface VitalinkMedication {
  id: string;
  cnk: string;
  name: string;
  dci: string;
  dosage: string;
  posology: string;
  route: string;
  prescriber: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'stopped' | 'paused';
  isNarcotic: boolean;
  instructions?: string;
}

const vitalinkMeds: VitalinkMedication[] = [
  { id: '1', cnk: '2345678', name: 'Metformine Sandoz 850 mg', dci: 'Metformine', dosage: '850 mg', posology: '1 co matin + 1 co soir', route: 'Oral', prescriber: 'Dr. Dupont (INAMI 1-12345-67-890)', startDate: '01/01/2025', status: 'active', isNarcotic: false, instructions: 'Pendant le repas' },
  { id: '2', cnk: '3456789', name: 'Lisinopril Teva 10 mg', dci: 'Lisinopril', dosage: '10 mg', posology: '1 co le matin', route: 'Oral', prescriber: 'Dr. Dupont (INAMI 1-12345-67-890)', startDate: '15/02/2025', status: 'active', isNarcotic: false },
  { id: '3', cnk: '4567890', name: 'Lantus SoloStar 100 UI/ml', dci: 'Insuline glargine', dosage: '18 UI', posology: '1 injection SC le soir', route: 'Sous-cutané', prescriber: 'Dr. Janssen (INAMI 1-98765-43-210)', startDate: '01/03/2025', status: 'active', isNarcotic: false, instructions: 'Rotation sites injection (abdomen)' },
  { id: '4', cnk: '5678901', name: 'Dafalgan 1 g', dci: 'Paracétamol', dosage: '1 g', posology: 'Si douleur, max 3x/jour', route: 'Oral', prescriber: 'Dr. Dupont', startDate: '01/02/2025', endDate: '01/04/2025', status: 'active', isNarcotic: false },
  { id: '5', cnk: '6789012', name: 'Tramadol 50 mg', dci: 'Tramadol', dosage: '50 mg', posology: '1 co si douleur intense', route: 'Oral', prescriber: 'Dr. Dupont', startDate: '01/12/2024', endDate: '01/01/2025', status: 'stopped', isNarcotic: true },
];

/* ─── SumEHR Data ─── */
const sumehrData = {
  lastUpdate: '28/02/2025',
  source: 'Dr. Dupont — Cabinet Médecine Générale, Bruxelles',
  allergies: ['Pénicilline (rash cutané)', 'Aspirine (bronchospasme)'],
  activeProblems: ['Diabète type 2 (E11.9)', 'HTA essentielle (I10)', 'Gonarthrose bilatérale (M17.0)'],
  inactiveProblems: ['Appendicectomie (2005)', 'Fracture poignet D (2018)'],
  vaccinations: [
    { name: 'COVID-19 Pfizer — 4e dose', date: '15/10/2024' },
    { name: 'Grippe 2024-2025', date: '01/11/2024' },
    { name: 'Pneumocoque Prevenar 20', date: '01/06/2023' },
  ],
};

export function VitalinkPage() {
  const [lastSync, setLastSync] = useState('06/03/2025 08:45');

  const medicationTab = (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-muted)]">{vitalinkMeds.filter(m => m.status === 'active').length} médicaments actifs</p>
        <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => setLastSync(new Date().toLocaleString('fr-BE'))}>
          <RefreshCw className="h-3.5 w-3.5" /> Actualiser
        </Button>
      </div>

      {vitalinkMeds.map(med => (
        <Card key={med.id} className={med.status === 'stopped' ? 'opacity-60' : ''}>
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">{med.name}</p>
                {med.isNarcotic && <Badge variant="red">Stupéfiant</Badge>}
              </div>
              <p className="text-xs text-[var(--text-muted)]">DCI: {med.dci} · CNK: {med.cnk}</p>
              <div className="flex items-center gap-2 text-sm">
                <Pill className="h-3.5 w-3.5 text-mc-blue-500" />
                <span>{med.posology}</span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">{med.route} · Prescrit par {med.prescriber}</p>
              {med.instructions && (
                <div className="flex items-start gap-1.5 mt-1 p-1.5 rounded bg-mc-amber-500/10 text-xs">
                  <AlertTriangle className="h-3.5 w-3.5 text-mc-amber-500 mt-0.5 shrink-0" />
                  <span>{med.instructions}</span>
                </div>
              )}
            </div>
            <Badge variant={med.status === 'active' ? 'green' : med.status === 'paused' ? 'amber' : 'default'}>
              {med.status === 'active' ? 'Actif' : med.status === 'paused' ? 'Pause' : 'Arrêté'}
            </Badge>
          </div>
          <div className="flex gap-4 mt-2 text-xs text-[var(--text-muted)]">
            <span>Début: {med.startDate}</span>
            {med.endDate && <span>Fin: {med.endDate}</span>}
          </div>
        </Card>
      ))}
    </div>
  );

  const sumehrTab = (
    <div className="space-y-3">
      <Card glass>
        <div className="flex items-center gap-2 text-sm">
          <Shield className="h-4 w-4 text-mc-green-500" />
          <span>SumEHR vérifié · Source: {sumehrData.source}</span>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-1">Dernière mise à jour: {sumehrData.lastUpdate}</p>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-mc-red-500">Allergies & Intolérances</CardTitle></CardHeader>
        <div className="space-y-1.5">
          {sumehrData.allergies.map((a, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-mc-red-500" />
              <span>{a}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>Problèmes actifs</CardTitle></CardHeader>
        <div className="space-y-1.5">
          {sumehrData.activeProblems.map((p, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 rounded-full bg-mc-amber-500" />
              <span>{p}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>Antécédents</CardTitle></CardHeader>
        <div className="space-y-1.5">
          {sumehrData.inactiveProblems.map((p, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <div className="h-2 w-2 rounded-full bg-[var(--border-default)]" />
              <span>{p}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>Vaccinations</CardTitle></CardHeader>
        <div className="space-y-1.5">
          {sumehrData.vaccinations.map((v, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-mc-green-500" />
                <span>{v.name}</span>
              </div>
              <span className="text-xs text-[var(--text-muted)]">{v.date}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const tabs = [
    { id: 'medication', label: 'Schéma médicamenteux', content: medicationTab },
    { id: 'sumehr', label: 'SumEHR', content: sumehrTab },
  ];

  return (
    <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <GradientHeader
        icon={<Pill className="h-5 w-5" />}
        title="Vitalink"
        subtitle={`Synchro: ${lastSync}`}
        badge={<Badge variant="green">Connecté</Badge>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{vitalinkMeds.filter(m => m.status === 'active').length}</p>
            <p className="text-[10px] text-white/60">Médicaments</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{sumehrData.allergies.length}</p>
            <p className="text-[10px] text-white/60">Allergies</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{sumehrData.activeProblems.length}</p>
            <p className="text-[10px] text-white/60">Problèmes</p>
          </div>
        </div>
      </GradientHeader>

      {/* Drug interaction alert */}
      <Card glass className="border-l-4 border-l-mc-red-500">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-mc-red-500 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-mc-red-500">Interaction détectée</p>
            <p className="text-xs text-[var(--text-muted)]">
              Metformine + Tramadol — Risque hypoglycémie accru. Tramadol arrêté depuis 01/01/2025.
            </p>
          </div>
        </div>
      </Card>

      <ContentTabs tabs={tabs} />
    </AnimatedPage>
  );
}
