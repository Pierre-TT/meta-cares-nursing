import { useState } from 'react';
import {
  ArrowLeft,
  Send,
  PenLine,
  Paperclip,
  Search,
  Star,
  User,
  Shield,
  X,
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, Input, ContentTabs, AnimatedPage } from '@/design-system';
import { featureFlags } from '@/lib/featureFlags';
import { MockFeatureNotice } from '@/components/MockFeatureNotice';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  from: string;
  fromRole: string;
  subject: string;
  preview: string;
  date: string;
  read: boolean;
  starred: boolean;
  hasAttachment: boolean;
}

const mockInbox: Message[] = [
  { id: '1', from: 'Dr. Martin Philippe', fromRole: 'Médecin traitant', subject: 'Résultats labo — Dubois Marie', preview: 'Voici les résultats de la prise de sang du 04/03. Glycémie à jeun légèrement élevée...', date: '06/03 09:15', read: false, starred: false, hasAttachment: true },
  { id: '2', from: 'Pharmacie Centrale', fromRole: 'Pharmacien', subject: 'Modification traitement Janssen P.', preview: 'Le Metformine 850mg n\'est plus disponible. Remplacement par générique...', date: '05/03 16:30', read: false, starred: true, hasAttachment: false },
  { id: '3', from: 'CHU Saint-Pierre', fromRole: 'Hôpital', subject: 'Lettre de sortie — Lambert Jeanne', preview: 'Suite à l\'hospitalisation du 28/02, veuillez trouver ci-joint la lettre de sortie...', date: '04/03 11:00', read: true, starred: false, hasAttachment: true },
  { id: '4', from: 'Dr. Wouters Clara', fromRole: 'Spécialiste', subject: 'RDV contrôle plaie Willems A.', preview: 'Pourriez-vous me faire parvenir les photos d\'évolution de la plaie...', date: '03/03 14:20', read: true, starred: false, hasAttachment: false },
  { id: '5', from: 'Mutualité Chrétienne', fromRole: 'Mutualité', subject: 'Accord soins — Martin Claudine', preview: 'L\'accord pour les soins infirmiers forfait B a été approuvé pour une durée de...', date: '02/03 10:45', read: true, starred: true, hasAttachment: true },
];

const mockSent: Message[] = [
  { id: 's1', from: 'Vous', fromRole: 'Infirmier(e)', subject: 'Rapport plaie — Willems André', preview: 'Ci-joint le rapport d\'évolution de la plaie sacrum avec photos...', date: '05/03 17:00', read: true, starred: false, hasAttachment: true },
  { id: 's2', from: 'Vous', fromRole: 'Infirmier(e)', subject: 'Demande renouvellement ordonnance', preview: 'Dr. Martin, pourriez-vous renouveler l\'ordonnance de Mme Dubois...', date: '04/03 08:30', read: true, starred: false, hasAttachment: false },
];

export function EHealthBoxPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [composing, setComposing] = useState(false);
  const [compose, setCompose] = useState({ to: '', subject: '', body: '' });

  if (!featureFlags.enableHealthcareMocks) {
    return <MockFeatureNotice feature="Boite eHealthBox" />;
  }

  const filteredInbox = search
    ? mockInbox.filter(m => m.from.toLowerCase().includes(search.toLowerCase()) || m.subject.toLowerCase().includes(search.toLowerCase()))
    : mockInbox;

  const unread = mockInbox.filter(m => !m.read).length;

  const MessageRow = ({ msg }: { msg: Message }) => (
    <Card hover padding="sm" className="cursor-pointer">
      <div className="flex items-start gap-3">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
          !msg.read ? 'bg-mc-blue-50 dark:bg-mc-blue-900/30' : 'bg-[var(--bg-tertiary)]'
        }`}>
          <User className={`h-5 w-5 ${!msg.read ? 'text-mc-blue-500' : 'text-[var(--text-muted)]'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm truncate ${!msg.read ? 'font-bold' : 'font-medium'}`}>{msg.from}</p>
            {msg.starred && <Star className="h-3 w-3 text-mc-amber-500 fill-mc-amber-500 shrink-0" />}
            {msg.hasAttachment && <Paperclip className="h-3 w-3 text-[var(--text-muted)] shrink-0" />}
          </div>
          <p className={`text-xs truncate ${!msg.read ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
            {msg.subject}
          </p>
          <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{msg.preview}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] text-[var(--text-muted)]">{msg.date}</p>
          {!msg.read && <div className="h-2 w-2 rounded-full bg-mc-blue-500 mt-1 ml-auto" />}
        </div>
      </div>
    </Card>
  );

  const tabs = [
    {
      label: `Boîte de réception (${unread})`,
      content: (
        <div className="space-y-2">
          {filteredInbox.map(msg => <MessageRow key={msg.id} msg={msg} />)}
        </div>
      ),
    },
    {
      label: 'Envoyés',
      content: (
        <div className="space-y-2">
          {mockSent.map(msg => <MessageRow key={msg.id} msg={msg} />)}
        </div>
      ),
    },
  ];

  return (
    <AnimatedPage className="px-4 py-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">eHealthBox</h1>
            <Shield className="h-4 w-4 text-mc-green-500" />
          </div>
          <p className="text-sm text-[var(--text-muted)]">Messagerie sécurisée eHealth</p>
        </div>
        <Button variant="gradient" size="sm" onClick={() => setComposing(true)}>
          <PenLine className="h-4 w-4" />
          Nouveau
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Rechercher messages..."
        icon={<Search className="h-4 w-4" />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Compose overlay */}
      {composing && (
        <Card className="border-mc-blue-200 dark:border-mc-blue-800 space-y-3">
          <CardHeader>
            <CardTitle>Nouveau message</CardTitle>
            <button onClick={() => setComposing(false)}><X className="h-4 w-4 text-[var(--text-muted)]" /></button>
          </CardHeader>
          <Input
            label="Destinataire"
            placeholder="Rechercher par nom ou n° INAMI..."
            icon={<User className="h-4 w-4" />}
            value={compose.to}
            onChange={(e) => setCompose(c => ({ ...c, to: e.target.value }))}
          />
          <Input
            label="Objet"
            placeholder="Objet du message"
            value={compose.subject}
            onChange={(e) => setCompose(c => ({ ...c, subject: e.target.value }))}
          />
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Message</label>
            <textarea
              value={compose.body}
              onChange={(e) => setCompose(c => ({ ...c, body: e.target.value }))}
              placeholder="Votre message..."
              rows={4}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-sm resize-none outline-none"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Paperclip className="h-4 w-4" />
              Joindre
            </Button>
            <Button variant="gradient" size="sm" className="flex-1" onClick={() => setComposing(false)}>
              <Send className="h-4 w-4" />
              Envoyer
            </Button>
          </div>
        </Card>
      )}

      <ContentTabs tabs={tabs} />
    </AnimatedPage>
  );
}
