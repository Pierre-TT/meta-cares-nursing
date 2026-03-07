import { useState } from 'react';
import { Calendar, Clock, Star, Plus, X, Repeat, ChevronRight } from 'lucide-react';
import { Card, Badge, Button, Avatar, AnimatedPage, GradientHeader, ContentTabs } from '@/design-system';

const upcomingVisits = [
  { id: 'v1', date: 'Aujourd\'hui', time: '10:30', nurse: 'Marie Laurent', acts: 'Toilette + Plaie + Pilulier', status: 'confirmed' as const },
  { id: 'v2', date: 'Demain', time: '10:30', nurse: 'Marie Laurent', acts: 'Toilette + Glycémie + Pilulier', status: 'confirmed' as const },
  { id: 'v3', date: 'Dim 09/03', time: '09:00', nurse: 'Sophie Dupuis', acts: 'Toilette + Pilulier', status: 'confirmed' as const },
  { id: 'v4', date: 'Lun 10/03', time: '10:30', nurse: 'Marie Laurent', acts: 'Toilette + Plaie + Pilulier + Glycémie', status: 'pending' as const },
];

const pastVisits = [
  { id: 'p1', date: '05/03', time: '10:25', nurse: 'Marie Laurent', acts: 'Toilette + Glycémie', duration: '35 min', rating: 5 },
  { id: 'p2', date: '04/03', time: '10:40', nurse: 'Sophie Dupuis', acts: 'Toilette + Plaie', duration: '40 min', rating: 4 },
  { id: 'p3', date: '03/03', time: '10:30', nurse: 'Marie Laurent', acts: 'Toilette + Pilulier', duration: '25 min', rating: 5 },
];

const recurringPattern = [
  { day: 'Lun', time: '10:30', acts: 'Toilette + Plaie + Pilulier + Glycémie' },
  { day: 'Mar', time: '10:30', acts: 'Toilette + Glycémie + Pilulier' },
  { day: 'Mer', time: '10:30', acts: 'Toilette + Pilulier' },
  { day: 'Jeu', time: '10:30', acts: 'Toilette + Plaie + Pilulier' },
  { day: 'Ven', time: '10:30', acts: 'Toilette + Glycémie + Pilulier' },
  { day: 'Sam', time: '10:30', acts: 'Toilette + Pilulier' },
  { day: 'Dim', time: '09:00', acts: 'Toilette + Pilulier' },
];

export function AppointmentsPage() {
  const [showRequest, setShowRequest] = useState(false);

  const tabs = [
    {
      id: 'upcoming',
      label: `À venir (${upcomingVisits.length})`,
      content: (
        <div className="space-y-2">
          {upcomingVisits.map(v => (
            <Card key={v.id} hover padding="sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-mc-blue-50 dark:bg-mc-blue-900/20 flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5 text-mc-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{v.date} — {v.time}</p>
                    <Badge variant={v.status === 'confirmed' ? 'green' : 'amber'}>
                      {v.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">{v.nurse}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{v.acts}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
              </div>
            </Card>
          ))}
        </div>
      ),
    },
    {
      id: 'recurring',
      label: 'Récurrent',
      content: (
        <div className="space-y-2">
          <Card className="flex items-center gap-2 mb-2">
            <Repeat className="h-4 w-4 text-mc-blue-500" />
            <p className="text-xs font-medium">Planning hebdomadaire récurrent</p>
          </Card>
          {recurringPattern.map(r => (
            <div key={r.day} className="flex items-center gap-3 py-2 border-b border-[var(--border-subtle)] last:border-0">
              <span className="w-8 text-xs font-bold text-mc-blue-500">{r.day}</span>
              <Clock className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              <span className="text-xs">{r.time}</span>
              <span className="text-[10px] text-[var(--text-muted)] flex-1 truncate">{r.acts}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'history',
      label: 'Historique',
      content: (
        <div className="space-y-2">
          {pastVisits.map(v => (
            <Card key={v.id} padding="sm">
              <div className="flex items-center gap-3">
                <Avatar name={v.nurse} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{v.date} — {v.time}</p>
                  <p className="text-xs text-[var(--text-muted)]">{v.nurse} · {v.duration}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{v.acts}</p>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3 w-3 ${i < v.rating ? 'text-mc-amber-500 fill-mc-amber-500' : 'text-[var(--text-muted)]'}`} />
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ),
    },
  ];

  return (
    <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <GradientHeader
        icon={<Calendar className="h-5 w-5" />}
        title="Mes Rendez-vous"
        subtitle={`${upcomingVisits.length} visites à venir`}
        badge={<Button variant="outline" size="sm" className="text-white border-white/30 hover:bg-white/10" onClick={() => setShowRequest(true)}><Plus className="h-3.5 w-3.5" />Demander</Button>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">7</p>
            <p className="text-[10px] text-white/60">Visites/sem</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">4.8</p>
            <p className="text-[10px] text-white/60">Note moy.</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">95%</p>
            <p className="text-[10px] text-white/60">Ponctualité</p>
          </div>
        </div>
      </GradientHeader>

      {/* Request visit modal */}
      {showRequest && (
        <Card className="border-2 border-mc-blue-500/30">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold">Demander une visite</p>
            <button onClick={() => setShowRequest(false)}><X className="h-4 w-4" /></button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Date souhaitée</label>
              <input type="date" className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Urgence</label>
              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 rounded-lg border border-[var(--border-default)] text-sm hover:border-mc-blue-500">Routine</button>
                <button className="flex-1 px-3 py-2 rounded-lg border border-red-300 text-sm text-red-500 hover:bg-red-50">Urgent</button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Description</label>
              <textarea rows={2} placeholder="Décrivez votre besoin..." className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm" />
            </div>
            <Button variant="gradient" className="w-full">Envoyer la demande</Button>
          </div>
        </Card>
      )}

      <ContentTabs tabs={tabs} />
    </AnimatedPage>
  );
}
