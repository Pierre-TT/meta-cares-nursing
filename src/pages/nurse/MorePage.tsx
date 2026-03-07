import { useNavigate } from 'react-router-dom';
import { FileText, Video, Brain, Globe, BarChart3, Shield, Pill, Settings, User, ChevronRight, BellRing, BookOpen, FileCheck, ClipboardList, MessageCircle, CalendarDays, AlertTriangle, Package, GraduationCap, ArrowRightLeft, ScanLine, Siren, Car, Activity, HeartPulse } from 'lucide-react';
import { Card, Badge, AnimatedPage, GradientHeader } from '@/design-system';

interface QuickLink {
  icon: React.ReactNode;
  label: string;
  description: string;
  path: string;
  badge?: string;
}

interface LinkCategory {
  title: string;
  links: QuickLink[];
}

const categories: LinkCategory[] = [
  {
    title: 'Obligations légales',
    links: [
      { icon: <BookOpen className="h-5 w-5 text-mc-blue-500" />, label: 'Journal de Soins', description: 'Journal quotidien — AR 18/06/1990', path: '/nurse/journal', badge: '3' },
      { icon: <FileCheck className="h-5 w-5 text-mc-green-500" />, label: 'Attestations (ASD)', description: 'Attestations de Soins Donnés', path: '/nurse/asd', badge: '1' },
      { icon: <ClipboardList className="h-5 w-5 text-mc-amber-500" />, label: 'Plan de Soins', description: 'NANDA-I / NIC / NOC', path: '/nurse/care-plan' },
      { icon: <Shield className="h-5 w-5 text-mc-blue-500" />, label: 'Consentements', description: 'Vérification eHealth', path: '/nurse/consent' },
    ],
  },
  {
    title: 'Télésanté & IA',
    links: [
      { icon: <HeartPulse className="h-5 w-5 text-mc-red-500" />, label: 'Episodes HAD', description: 'Chambre virtuelle & rondes', path: '/nurse/had', badge: 'Nouveau' },
      { icon: <Video className="h-5 w-5 text-mc-green-500" />, label: 'Téléconsultation', description: 'Appels vidéo patients', path: '/nurse/teleconsultation', badge: '2' },
      { icon: <Brain className="h-5 w-5 text-mc-amber-500" />, label: 'Risque réhospitalisation', description: 'Dashboard prédictif IA', path: '/nurse/predictive' },
      { icon: <Globe className="h-5 w-5 text-mc-blue-400" />, label: 'Hubs de santé', description: 'CoZo · RSW · BruSafe+', path: '/nurse/health-hubs' },
    ],
  },
  {
    title: 'Communication & Planning',
    links: [
      { icon: <BellRing className="h-5 w-5 text-mc-red-500" />, label: 'Notifications', description: 'Clinique, facturation, planning', path: '/nurse/notifications', badge: '4' },
      { icon: <MessageCircle className="h-5 w-5 text-mc-blue-500" />, label: 'Chat équipe', description: 'Messages entre collègues', path: '/nurse/chat' },
      { icon: <CalendarDays className="h-5 w-5 text-mc-green-500" />, label: 'Disponibilités', description: 'Planning & demandes d\'absence', path: '/nurse/schedule' },
      { icon: <ArrowRightLeft className="h-5 w-5 text-mc-amber-500" />, label: 'Transmission', description: 'Relève infirmière patients', path: '/nurse/handover' },
    ],
  },
  {
    title: 'Outils cliniques',
    links: [
      { icon: <Pill className="h-5 w-5 text-mc-amber-500" />, label: 'Interactions médicamenteuses', description: 'Vérificateur BCFI', path: '/nurse/drug-check' },
      { icon: <Siren className="h-5 w-5 text-mc-red-500" />, label: 'Protocoles d\'urgence', description: 'Référence rapide', path: '/nurse/emergency' },
      { icon: <ScanLine className="h-5 w-5 text-mc-blue-500" />, label: 'Scanner documents', description: 'OCR & classification', path: '/nurse/scanner' },
      { icon: <AlertTriangle className="h-5 w-5 text-mc-amber-500" />, label: 'Incidents', description: 'Déclaration & suivi', path: '/nurse/incidents' },
    ],
  },
  {
    title: 'Suivi & Statistiques',
    links: [
      { icon: <Activity className="h-5 w-5 text-mc-blue-500" />, label: 'Statistiques', description: 'KPI, tendances, comparaison', path: '/nurse/statistics' },
      { icon: <Car className="h-5 w-5 text-mc-green-500" />, label: 'Kilométrage', description: 'Suivi & export frais', path: '/nurse/mileage' },
      { icon: <Package className="h-5 w-5 text-mc-amber-500" />, label: 'Inventaire', description: 'Stock matériel', path: '/nurse/inventory' },
      { icon: <GraduationCap className="h-5 w-5 text-mc-blue-500" />, label: 'Formation continue', description: 'Crédits & certifications', path: '/nurse/education' },
    ],
  },
  {
    title: 'Outils',
    links: [
      { icon: <FileText className="h-5 w-5 text-mc-blue-500" />, label: 'Rapports PDF', description: 'Générer et envoyer des rapports', path: '/nurse/reports' },
      { icon: <BarChart3 className="h-5 w-5 text-mc-green-500" />, label: 'Forfait vs Horaire', description: 'Comparaison pilote INAMI', path: '/nurse/hourly-comparison' },
      { icon: <Pill className="h-5 w-5 text-mc-amber-500" />, label: 'eAgreement', description: 'Accords MyCareNet', path: '/nurse/eagreement' },
    ],
  },
  {
    title: 'Compte',
    links: [
      { icon: <User className="h-5 w-5 text-mc-blue-500" />, label: 'Mon profil', description: 'INAMI, qualifications', path: '/nurse/profile' },
      { icon: <Settings className="h-5 w-5 text-[var(--text-muted)]" />, label: 'Paramètres', description: 'Langue, thème, sync', path: '/nurse/settings' },
    ],
  },
];

const notifications = [
  { id: '1', title: 'Accord approuvé', message: 'Forfait B — Janssens Maria approuvé par MC 200', time: 'Il y a 15 min', read: false },
  { id: '2', title: 'Rappel plaie', message: 'Photo J+7 requise — Janssens Maria, jambe G', time: 'Il y a 1h', read: false },
  { id: '3', title: 'eFact accepté', message: 'Lot EF-2025-03-0422 accepté — €44.73', time: 'Il y a 2h', read: true },
  { id: '4', title: 'Téléconsultation', message: 'Appel programmé avec Van Damme Pierre à 15:30', time: 'Il y a 3h', read: true },
];

export function MorePage() {
  const navigate = useNavigate();
  const unread = notifications.filter(n => !n.read).length;

  return (
    <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <GradientHeader
        icon={<BellRing className="h-5 w-5" />}
        title="Plus"
        subtitle="Outils, obligations légales & paramètres"
        badge={unread > 0 ? <Badge variant="blue">{unread} notif</Badge> : undefined}
      />

      {/* Notifications */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-mc-blue-500" />
            <span className="font-semibold">Notifications</span>
          </div>
          {unread > 0 && <Badge variant="blue">{unread} nouvelle{unread > 1 ? 's' : ''}</Badge>}
        </div>
        <div className="space-y-2">
          {notifications.slice(0, 3).map(n => (
            <div key={n.id} className={`flex items-start gap-2 py-2 border-b border-[var(--border-subtle)] last:border-0 ${!n.read ? '' : 'opacity-60'}`}>
              {!n.read && <div className="h-2 w-2 rounded-full bg-mc-blue-500 mt-1.5 shrink-0" />}
              <div className={!n.read ? '' : 'ml-4'}>
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-[var(--text-muted)]">{n.message}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{n.time}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Grouped links */}
      {categories.map(cat => (
        <div key={cat.title} className="space-y-2">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide px-1">{cat.title}</p>
          {cat.links.map(link => (
            <Card
              key={link.path}
              className="cursor-pointer hover:ring-2 hover:ring-mc-blue-500/20 transition-all"
              onClick={() => navigate(link.path)}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
                  {link.icon}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{link.label}</p>
                  <p className="text-xs text-[var(--text-muted)]">{link.description}</p>
                </div>
                <div className="flex items-center gap-1">
                  {link.badge && <Badge variant="blue">{link.badge}</Badge>}
                  <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ))}
    </AnimatedPage>
  );
}
