import {
  AlertTriangle,
  ClipboardPlus,
  ClipboardList,
  FileText,
  MessageCircle,
  Navigation,
  Phone,
  Stethoscope,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/design-system';
import type { Patient } from '@/lib/patients';

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}

export function QuickPatientActions({ patient }: { patient: Patient }) {
  const navigate = useNavigate();

  const actions: QuickAction[] = [
    {
      icon: <Phone className="h-4 w-4" />,
      label: 'Appeler',
      color: 'bg-mc-green-500/10 text-mc-green-500',
      onClick: () => window.open(`tel:${patient.phone}`),
    },
    {
      icon: <Stethoscope className="h-4 w-4" />,
      label: 'Visite',
      color: 'bg-mc-blue-500/10 text-mc-blue-500',
      onClick: () => navigate(`/nurse/visit/${patient.id}`),
    },
    {
      icon: <ClipboardList className="h-4 w-4" />,
      label: 'BelRAI Prep',
      color: 'bg-purple-500/10 text-purple-500',
      onClick: () => navigate(`/nurse/belrai/${patient.id}`),
    },
    {
      icon: <FileText className="h-4 w-4" />,
      label: 'Plan soins',
      color: 'bg-mc-blue-500/10 text-mc-blue-500',
      onClick: () => navigate(`/nurse/care-plan?patientId=${patient.id}`),
    },
    {
      icon: <MessageCircle className="h-4 w-4" />,
      label: 'Transmission',
      color: 'bg-mc-blue-500/10 text-mc-blue-500',
      onClick: () => navigate('/nurse/handover'),
    },
    {
      icon: <AlertTriangle className="h-4 w-4" />,
      label: 'Incident',
      color: 'bg-mc-red-500/10 text-mc-red-500',
      onClick: () => navigate('/nurse/incidents'),
    },
    {
      icon: <Navigation className="h-4 w-4" />,
      label: 'Itinéraire',
      color: 'bg-mc-amber-500/10 text-mc-amber-500',
      onClick: () =>
        window.open(
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${patient.address.street} ${patient.address.houseNumber}, ${patient.address.postalCode} ${patient.address.city}`
          )}`,
          '_blank',
          'noopener,noreferrer'
        ),
    },
    {
      icon: <ClipboardPlus className="h-4 w-4" />,
      label: 'Briefing',
      color: 'bg-mc-blue-500/10 text-mc-blue-500',
      onClick: () => navigate(`/nurse/briefing/${patient.id}`),
    },
  ];

  return (
    <Card>
      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Actions rapides</p>
      <div className="grid grid-cols-4 gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className="flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors"
          >
            <div className={`h-9 w-9 rounded-lg ${action.color} flex items-center justify-center`}>
              {action.icon}
            </div>
            <span className="text-[10px] font-medium text-center">{action.label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
