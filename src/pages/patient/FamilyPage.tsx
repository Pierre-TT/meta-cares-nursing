import { Users, Phone, Shield, Bell, ChevronRight, Plus, Star, Video } from 'lucide-react';
import { Card, Badge, Button, Avatar, AnimatedPage, GradientHeader } from '@/design-system';

const familyMembers = [
  { id: 'f1', name: 'Pierre Dubois', relation: 'Fils', phone: '+32 475 12 34 56', email: 'pierre@email.be', access: 'full' as const, lastVisit: 'Hier' },
  { id: 'f2', name: 'Anne Dubois', relation: 'Fille', phone: '+32 478 98 76 54', email: 'anne@email.be', access: 'read' as const, lastVisit: 'Il y a 3 jours' },
  { id: 'f3', name: 'Dr. Martin Leroy', relation: 'Médecin traitant', phone: '+32 2 345 67 89', email: 'dr.leroy@cabinet.be', access: 'medical' as const, lastVisit: 'Il y a 1 semaine' },
];

const accessLabels = { full: 'Accès complet', read: 'Lecture seule', medical: 'Médical' };
const accessVariants = { full: 'green' as const, read: 'blue' as const, medical: 'amber' as const };

export function FamilyPage() {
  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<Users className="h-5 w-5" />}
        title="Cercle Familial"
        subtitle="Proches & aidants autorisés"
        badge={<Button variant="outline" size="sm" className="text-white border-white/30 hover:bg-white/10"><Plus className="h-3.5 w-3.5" />Inviter</Button>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{familyMembers.length}</p>
            <p className="text-[10px] text-white/60">Membres</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{familyMembers.filter(m => m.access === 'full').length}</p>
            <p className="text-[10px] text-white/60">Accès complet</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">RGPD</p>
            <p className="text-[10px] text-white/60">Conforme</p>
          </div>
        </div>
      </GradientHeader>

      {/* RGPD notice */}
      <Card glass className="flex items-center gap-3">
        <Shield className="h-5 w-5 text-mc-blue-500 shrink-0" />
        <div className="flex-1">
          <p className="text-xs font-medium">Protection des données</p>
          <p className="text-xs text-[var(--text-muted)]">L'accès aux données médicales est conforme au RGPD. Vous pouvez retirer un accès à tout moment.</p>
        </div>
      </Card>

      {/* Family list */}
      <div className="space-y-2">
        {familyMembers.map(member => (
          <Card key={member.id} hover padding="sm" className="cursor-pointer">
            <div className="flex items-center gap-3">
              <Avatar name={member.name} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{member.name}</p>
                  <Badge variant={accessVariants[member.access]}>{accessLabels[member.access]}</Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)]">{member.relation} • Vu {member.lastVisit}</p>
                <div className="flex items-center gap-3 mt-1">
                  <a href={`tel:${member.phone}`} className="flex items-center gap-1 text-xs text-mc-blue-500">
                    <Phone className="h-3 w-3" />{member.phone}
                  </a>
                  <button className="flex items-center gap-1 text-xs text-mc-green-500">
                    <Video className="h-3 w-3" /> Appel vidéo
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {member.relation === 'Médecin traitant' && <Star className="h-3.5 w-3.5 text-mc-amber-500 fill-mc-amber-500" />}
                <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Notifications */}
      <Card>
        <div className="flex items-center gap-3 mb-3">
          <Bell className="h-5 w-5 text-mc-blue-500" />
          <p className="text-sm font-semibold">Notifications famille</p>
        </div>
        <div className="space-y-2 text-xs text-[var(--text-muted)]">
          <p>• Pierre Dubois a consulté le rapport de soins — Hier 14:30</p>
          <p>• Anne Dubois a accédé aux paramètres vitaux — Il y a 3 jours</p>
          <p>• Dr. Leroy a mis à jour la prescription — Il y a 1 semaine</p>
        </div>
      </Card>
    </AnimatedPage>
  );
}
