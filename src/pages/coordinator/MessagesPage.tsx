import { useState } from 'react';
import { CheckCheck, FileText, MessageSquare, Send, Users } from 'lucide-react';
import { AnimatedPage, Avatar, Badge, Button, Card, ContentTabs, GradientHeader, Input } from '@/design-system';

type Conversation = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  type: 'direct' | 'broadcast';
};

type Template = {
  id: string;
  title: string;
  text: string;
};

const seedConversations: Conversation[] = [
  { id: 'c1', name: 'Marie Laurent', lastMessage: 'OK, visite Janssen confirmée à 09:15', time: '10:32', unread: 0, type: 'direct' },
  { id: 'c2', name: 'Sophie Dupuis', lastMessage: 'Prescription manquante pour Peeters H.', time: '09:50', unread: 1, type: 'direct' },
  { id: 'c3', name: 'Équipe complète', lastMessage: "Réunion d'équipe demain 08:00", time: '09:00', unread: 0, type: 'broadcast' },
  { id: 'c4', name: 'Laura Van Damme', lastMessage: 'Retard sur Willems - embouteillage', time: '08:45', unread: 2, type: 'direct' },
  { id: 'c5', name: 'Thomas Maes', lastMessage: 'Tournée terminée, RAS', time: '08:30', unread: 0, type: 'direct' },
];

const templates: Template[] = [
  { id: 't1', title: 'Patient annulé', text: 'Le patient {{patient}} a annulé sa visite de {{heure}}. Merci de réorganiser votre tournée.' },
  { id: 't2', title: 'Visite urgente', text: 'Visite urgente requise chez {{patient}} ({{adresse}}). Merci de prioriser.' },
  { id: 't3', title: 'Rappel prescription', text: 'Rappel: prescription manquante pour {{patient}}. Merci de scanner avant prochaine visite.' },
  { id: 't4', title: 'Réunion équipe', text: "Réunion d'équipe prévue le {{date}} à {{heure}}. Merci de confirmer votre présence." },
  { id: 't5', title: 'Remplacement', text: "Suite à l'absence de {{infirmier}}, vous êtes assigné(e) aux visites suivantes: {{visites}}" },
];

function getCurrentTimeLabel(date = new Date()) {
  return date.toLocaleTimeString('fr-BE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MessagesPage() {
  const [conversationRecords, setConversationRecords] = useState<Conversation[]>(seedConversations);
  const [directDraft, setDirectDraft] = useState('');
  const [broadcastDraft, setBroadcastDraft] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const unreadTotal = conversationRecords.reduce((sum, conversation) => sum + conversation.unread, 0);

  function handleSendDirect() {
    const nextMessage = directDraft.trim();

    if (!nextMessage) {
      setFeedback('Entrez un message avant envoi.');
      return;
    }

    const sentAt = getCurrentTimeLabel();

    setConversationRecords((previous) =>
      previous.map((conversation) =>
        conversation.id === 'c1'
          ? { ...conversation, lastMessage: nextMessage, time: sentAt, unread: 0 }
          : conversation
      )
    );
    setDirectDraft('');
    setFeedback('Message direct envoyé à Marie Laurent.');
  }

  function handleBroadcast() {
    const nextMessage = broadcastDraft.trim();

    if (!nextMessage) {
      setFeedback('Entrez un message avant diffusion.');
      return;
    }

    const sentAt = getCurrentTimeLabel();

    setConversationRecords((previous) =>
      previous.map((conversation) =>
        conversation.type === 'broadcast'
          ? { ...conversation, lastMessage: nextMessage, time: sentAt }
          : conversation
      )
    );
    setBroadcastDraft('');
    setFeedback('Message diffusé à toute l équipe.');
  }

  function handleUseTemplate(template: Template) {
    setDirectDraft(template.text);
    setBroadcastDraft(template.text);
    setFeedback(`Modèle chargé: ${template.title}.`);
  }

  const directTab = (
    <div className="space-y-2">
      {conversationRecords.filter((conversation) => conversation.type === 'direct').map((conversation) => (
        <Card key={conversation.id} hover padding="sm" className="cursor-pointer">
          <div className="flex items-center gap-3">
            <Avatar name={conversation.name} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{conversation.name}</p>
                <span className="text-[10px] text-[var(--text-muted)]">{conversation.time}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-[var(--text-muted)] truncate pr-2">{conversation.lastMessage}</p>
                {conversation.unread > 0 ? (
                  <span className="h-5 min-w-5 px-1.5 rounded-full bg-mc-blue-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {conversation.unread}
                  </span>
                ) : (
                  <CheckCheck className="h-3.5 w-3.5 text-mc-blue-500 shrink-0" />
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}

      <div className="flex gap-2 mt-4">
        <Input
          aria-label="Écrire un message..."
          placeholder="Écrire un message..."
          value={directDraft}
          onChange={(event) => setDirectDraft(event.target.value)}
          className="flex-1"
        />
        <Button
          type="button"
          variant="gradient"
          size="sm"
          aria-label="Envoyer message direct"
          onClick={handleSendDirect}
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  const broadcastTab = (
    <div className="space-y-3">
      <Card glass className="flex items-center gap-3">
        <Users className="h-5 w-5 text-mc-blue-500 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">Diffusion à toute l équipe</p>
          <p className="text-xs text-[var(--text-muted)]">Envoyer un message à tous les infirmiers actifs</p>
        </div>
      </Card>

      {conversationRecords.filter((conversation) => conversation.type === 'broadcast').map((conversation) => (
        <Card key={conversation.id} hover padding="sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-mc-blue-50 dark:bg-mc-blue-900/30 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-mc-blue-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{conversation.name}</p>
              <p className="text-xs text-[var(--text-muted)]">{conversation.lastMessage}</p>
            </div>
            <span className="text-[10px] text-[var(--text-muted)]">{conversation.time}</span>
          </div>
        </Card>
      ))}

      <div className="flex gap-2">
        <Input
          aria-label="Diffuser un message..."
          placeholder="Diffuser un message..."
          value={broadcastDraft}
          onChange={(event) => setBroadcastDraft(event.target.value)}
          className="flex-1"
        />
        <Button type="button" variant="gradient" size="sm" onClick={handleBroadcast}>
          <Send className="h-3.5 w-3.5" />
          Diffuser
        </Button>
      </div>
    </div>
  );

  const templatesTab = (
    <div className="space-y-2">
      {templates.map((template) => (
        <Card key={template.id} hover padding="sm" className="cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-mc-green-50 dark:bg-mc-green-900/30 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-mc-green-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{template.title}</p>
              <p className="text-xs text-[var(--text-muted)] truncate">{template.text}</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => handleUseTemplate(template)}>
              Utiliser
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );

  const tabs = [
    { label: `Direct (${unreadTotal})`, content: directTab },
    { label: 'Diffusion', content: broadcastTab },
    { label: 'Modèles', content: templatesTab },
  ];

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<MessageSquare className="h-5 w-5" />}
        title="Messages"
        subtitle="Communication équipe"
        badge={unreadTotal > 0 ? <Badge variant="red">{unreadTotal} non lu(s)</Badge> : <Badge variant="green">À jour</Badge>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{conversationRecords.length}</p>
            <p className="text-[10px] text-white/60">Conversations</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{unreadTotal}</p>
            <p className="text-[10px] text-white/60">Non lus</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{templates.length}</p>
            <p className="text-[10px] text-white/60">Modèles</p>
          </div>
        </div>
      </GradientHeader>

      {feedback && (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-mc-blue-500/20 bg-mc-blue-500/10 p-3">
          <Send className="h-4 w-4 text-mc-blue-500" />
          <span className="text-sm font-medium">{feedback}</span>
        </div>
      )}

      <ContentTabs tabs={tabs} />
    </AnimatedPage>
  );
}
