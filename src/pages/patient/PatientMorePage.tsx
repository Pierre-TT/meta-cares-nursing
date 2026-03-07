import { useNavigate } from 'react-router-dom';
import { MessageCircle, Calendar, Euro, BookOpen, ClipboardList, Users, Settings, LogOut, Shield, Accessibility, HeartPulse } from 'lucide-react';
import { Card, Button, AnimatedPage } from '@/design-system';

const sections = [
  {
    title: 'Services',
    items: [
      { icon: HeartPulse, label: 'Mode HAD', path: '/patient/hospital-mode', color: 'text-mc-red-500', bg: 'bg-mc-red-50 dark:bg-red-900/20' },
      { icon: MessageCircle, label: 'Messages', path: '/patient/messages', color: 'text-mc-blue-500', bg: 'bg-mc-blue-50 dark:bg-mc-blue-900/20' },
      { icon: Calendar, label: 'Rendez-vous', path: '/patient/appointments', color: 'text-mc-green-500', bg: 'bg-mc-green-50 dark:bg-mc-green-900/20' },
      { icon: Euro, label: 'Mes Coûts', path: '/patient/costs', color: 'text-mc-amber-500', bg: 'bg-mc-amber-50 dark:bg-amber-900/20' },
      { icon: BookOpen, label: 'Journal de soins', path: '/patient/diary', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    ],
  },
  {
    title: 'Santé',
    items: [
      { icon: ClipboardList, label: 'Questionnaires', path: '/patient/questionnaire', color: 'text-mc-blue-500', bg: 'bg-mc-blue-50 dark:bg-mc-blue-900/20' },
      { icon: Users, label: 'Cercle familial', path: '/patient/family', color: 'text-mc-green-500', bg: 'bg-mc-green-50 dark:bg-mc-green-900/20' },
      { icon: Shield, label: 'Mes données (RGPD)', path: '/patient/more', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
      { icon: Accessibility, label: 'Accessibilité', path: '/patient/more', color: 'text-mc-blue-400', bg: 'bg-mc-blue-50 dark:bg-mc-blue-900/20' },
    ],
  },
];

export function PatientMorePage() {
  const navigate = useNavigate();

  return (
    <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-6">
      {sections.map(section => (
        <div key={section.title}>
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">{section.title}</p>
          <div className="grid grid-cols-4 gap-3">
            {section.items.map(item => (
              <button key={item.label} onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors">
                <div className={`h-10 w-10 rounded-xl ${item.bg} flex items-center justify-center`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <span className="text-[10px] font-medium text-center leading-tight">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      <Card className="flex items-center gap-3">
        <Settings className="h-5 w-5 text-[var(--text-muted)]" />
        <div className="flex-1">
          <p className="text-sm font-medium">Paramètres</p>
          <p className="text-[10px] text-[var(--text-muted)]">Notifications, langue, thème</p>
        </div>
      </Card>

      <Button variant="outline" className="w-full text-red-500 border-red-200 hover:bg-red-50">
        <LogOut className="h-4 w-4" /> Se déconnecter
      </Button>
    </AnimatedPage>
  );
}
