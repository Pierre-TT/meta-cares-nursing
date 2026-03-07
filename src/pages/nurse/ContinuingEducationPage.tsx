import { useState } from 'react';
import { GraduationCap, BookOpen, Award, Clock, ChevronRight, Play, CheckCircle, Lock } from 'lucide-react';
import { GradientHeader, Tabs, Card, Badge, Button, StatRing, AnimatedPage } from '@/design-system';

interface Module {
  id: string;
  title: string;
  category: string;
  duration: string;
  credits: number;
  status: 'completed' | 'in_progress' | 'locked' | 'available';
  progress?: number;
  completedDate?: string;
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  obtainedDate: string;
  expiryDate: string;
  status: 'valid' | 'expiring' | 'expired';
}

const modules: Module[] = [
  { id: '1', title: 'Soins de plaies complexes — niveau avancé', category: 'Soins techniques', duration: '4h', credits: 8, status: 'completed', completedDate: '15/02/2025' },
  { id: '2', title: 'Gestion de la douleur à domicile', category: 'Soins palliatifs', duration: '3h', credits: 6, status: 'completed', completedDate: '01/03/2025' },
  { id: '3', title: 'Pharmacovigilance — interactions médicamenteuses', category: 'Pharmacologie', duration: '2h30', credits: 5, status: 'in_progress', progress: 65 },
  { id: '4', title: 'Communication avec le patient dément', category: 'Gériatrie', duration: '2h', credits: 4, status: 'in_progress', progress: 30 },
  { id: '5', title: 'Prévention des infections — hygiène des mains', category: 'Hygiène', duration: '1h30', credits: 3, status: 'available' },
  { id: '6', title: 'Soins palliatifs — accompagnement fin de vie', category: 'Soins palliatifs', duration: '5h', credits: 10, status: 'available' },
  { id: '7', title: 'Diabétologie — insulinothérapie avancée', category: 'Soins techniques', duration: '3h', credits: 6, status: 'available' },
  { id: '8', title: 'Télémédecine & monitoring à distance', category: 'Innovation', duration: '2h', credits: 4, status: 'locked' },
  { id: '9', title: 'Réglementation INAMI — nomenclature 2025', category: 'Réglementation', duration: '2h', credits: 4, status: 'available' },
];

const certifications: Certification[] = [
  { id: '1', name: 'Visa infirmier — SPF Santé publique', issuer: 'SPF Santé publique', obtainedDate: '01/01/2023', expiryDate: '31/12/2027', status: 'valid' },
  { id: '2', name: 'Agrément soins infirmiers à domicile', issuer: 'AVIQ / COCOM', obtainedDate: '15/03/2023', expiryDate: '14/03/2026', status: 'expiring' },
  { id: '3', name: 'Formation continue — accréditation annuelle', issuer: 'INAMI', obtainedDate: '01/01/2025', expiryDate: '31/12/2025', status: 'valid' },
  { id: '4', name: 'BLS/AED — Réanimation', issuer: 'Croix-Rouge', obtainedDate: '10/06/2023', expiryDate: '10/06/2025', status: 'expiring' },
];

const statusConfig = {
  completed: { label: 'Terminé', variant: 'green' as const, icon: <CheckCircle className="h-3.5 w-3.5" /> },
  in_progress: { label: 'En cours', variant: 'blue' as const, icon: <Play className="h-3.5 w-3.5" /> },
  available: { label: 'Disponible', variant: 'default' as const, icon: <BookOpen className="h-3.5 w-3.5" /> },
  locked: { label: 'Verrouillé', variant: 'default' as const, icon: <Lock className="h-3.5 w-3.5" /> },
};

const certStatusConfig = {
  valid: { label: 'Valide', variant: 'green' as const },
  expiring: { label: 'Expire bientôt', variant: 'amber' as const },
  expired: { label: 'Expiré', variant: 'red' as const },
};

export function ContinuingEducationPage() {
  const [tab, setTab] = useState('modules');

  const earnedCredits = modules.filter(m => m.status === 'completed').reduce((s, m) => s + m.credits, 0);
  const requiredCredits = 60;
  const completedCount = modules.filter(m => m.status === 'completed').length;
  const inProgressCount = modules.filter(m => m.status === 'in_progress').length;

  return (
    <AnimatedPage>
      <GradientHeader
        title="Formation continue"
        subtitle="Crédits & certifications"
        icon={<GraduationCap className="h-5 w-5 text-white" />}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{earnedCredits}/{requiredCredits}</p>
            <p className="text-[10px] text-white/60">Crédits</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{completedCount}</p>
            <p className="text-[10px] text-white/60">Terminés</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{inProgressCount}</p>
            <p className="text-[10px] text-white/60">En cours</p>
          </div>
        </div>
      </GradientHeader>

      <div className="px-4 py-4 space-y-4 max-w-lg mx-auto">
        {/* Credit ring */}
        <Card className="flex items-center gap-4">
          <StatRing value={earnedCredits} max={requiredCredits} label="Crédits" size={64} color="green" />
          <div>
            <p className="text-sm font-semibold">{earnedCredits} crédits obtenus</p>
            <p className="text-xs text-[var(--text-muted)]">Objectif annuel: {requiredCredits} crédits (cycle 2023-2027)</p>
            <p className="text-xs text-mc-green-500 font-medium mt-0.5">
              {requiredCredits - earnedCredits} crédits restants
            </p>
          </div>
        </Card>

        <Tabs
          tabs={[
            { id: 'modules', label: 'Modules' },
            { id: 'certifications', label: 'Certifications' },
          ]}
          activeTab={tab}
          onChange={setTab}
        />

        {tab === 'modules' && (
          <div className="space-y-2">
            {modules.map(mod => {
              const cfg = statusConfig[mod.status];
              return (
                <Card key={mod.id} className={`${mod.status === 'locked' ? 'opacity-50' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-mc-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">{mod.title}</p>
                        <ChevronRight className="h-4 w-4 text-[var(--text-muted)] shrink-0 mt-0.5" />
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        <span className="text-xs text-[var(--text-muted)]">{mod.category}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-[var(--text-muted)]">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {mod.duration}</span>
                        <span className="flex items-center gap-1"><Award className="h-3 w-3" /> {mod.credits} crédits</span>
                        {mod.completedDate && <span>✓ {mod.completedDate}</span>}
                      </div>
                      {mod.progress !== undefined && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] mb-0.5">
                            <span>Progression</span>
                            <span>{mod.progress}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                            <div className="h-full rounded-full bg-mc-blue-500 transition-all" style={{ width: `${mod.progress}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {tab === 'certifications' && (
          <div className="space-y-2">
            {certifications.map(cert => {
              const cfg = certStatusConfig[cert.status];
              return (
                <Card key={cert.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{cert.name}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{cert.issuer}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-[var(--text-muted)]">
                        <span>Obtenu: {cert.obtainedDate}</span>
                        <span>Expire: {cert.expiryDate}</span>
                      </div>
                    </div>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </div>
                  {cert.status === 'expiring' && (
                    <Button variant="outline" size="sm" className="mt-2 w-full text-xs">
                      Renouveler
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}
