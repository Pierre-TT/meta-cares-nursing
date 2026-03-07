import { useState } from 'react';
import { MessageSquare, Send, Users, FileText, CheckCheck } from 'lucide-react';
import { Card, Badge, Avatar, Button, Input, AnimatedPage, GradientHeader, ContentTabs } from '@/design-system';

const conversations = [
  { id: 'c1', name: 'Marie Laurent', lastMessage: 'OK, visite Janssen confirmée à 09:15', time: '10:32', unread: 0, type: 'direct' as const },
  { id: 'c2', name: 'Sophie Dupuis', lastMessage: 'Prescription manquante pour Peeters H.', time: '09:50', unread: 1, type: 'direct' as const },
  { id: 'c3', name: 'Équipe complète', lastMessage: 'Réunion d\'équipe demain 08:00', time: '09:00', unread: 0, type: 'broadcast' as const },
  { id: 'c4', name: 'Laura Van Damme', lastMessage: 'Retard sur Willems — embouteillage', time: '08:45', unread: 2, type: 'direct' as const },
  { id: 'c5', name: 'Thomas Maes', lastMessage: 'Tournée terminée, RAS', time: '08:30', unread: 0, type: 'direct' as const },
];

const templates = [
  { id: 't1', title: 'Patient annulé', text: '⚠️ Le patient {{patient}} a annulé sa visite de {{heure}}. Merci de réorganiser votre tournée.' },
  { id: 't2', title: 'Visite urgente', text: '🚨 Visite urgente requise chez {{patient}} ({{adresse}}). Merci de prioriser.' },
  { id: 't3', title: 'Rappel prescription', text: '📋 Rappel: prescription manquante pour {{patient}}. Merci de scanner avant prochaine visite.' },
  { id: 't4', title: 'Réunion équipe', text: '👥 Réunion d\'équipe prévue le {{date}} à {{heure}}. Merci de confirmer votre présence.' },
  { id: 't5', title: 'Remplacement', text: '🔄 Suite à l\'absence de {{infirmier}}, vous êtes assigné(e) aux visites suivantes: {{visites}}' },
];

export function MessagesPage() {
  const [message, setMessage] = useState('');
  const unreadTotal = conversations.reduce((s, c) => s + c.unread, 0);

  const directTab = (
    <div className="space-y-2">
      {conversations.filter(c => c.type === 'direct').map(conv => (
        <Card key={conv.id} hover padding="sm" className="cursor-pointer">
          <div className="flex items-center gap-3">
            <Avatar name={conv.name} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{conv.name}</p>
                <span className="text-[10px] text-[var(--text-muted)]">{conv.time}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-[var(--text-muted)] truncate pr-2">{conv.lastMessage}</p>
                {conv.unread > 0 ? (
                  <span className="h-5 min-w-5 px-1.5 rounded-full bg-mc-blue-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{conv.unread}</span>
                ) : (
                  <CheckCheck className="h-3.5 w-3.5 text-mc-blue-500 shrink-0" />
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}

      {/* Quick compose */}
      <div className="flex gap-2 mt-4">
        <Input placeholder="Écrire un message..." value={message} onChange={e => setMessage(e.target.value)} className="flex-1" />
        <Button variant="gradient" size="sm"><Send className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );

  const broadcastTab = (
    <div className="space-y-3">
      <Card glass className="flex items-center gap-3">
        <Users className="h-5 w-5 text-mc-blue-500 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">Diffusion à toute l'équipe</p>
          <p className="text-xs text-[var(--text-muted)]">Envoyer un message à tous les infirmiers actifs</p>
        </div>
      </Card>

      {conversations.filter(c => c.type === 'broadcast').map(conv => (
        <Card key={conv.id} hover padding="sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-mc-blue-50 dark:bg-mc-blue-900/30 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-mc-blue-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{conv.name}</p>
              <p className="text-xs text-[var(--text-muted)]">{conv.lastMessage}</p>
            </div>
            <span className="text-[10px] text-[var(--text-muted)]">{conv.time}</span>
          </div>
        </Card>
      ))}

      <div className="flex gap-2">
        <Input placeholder="Diffuser un message..." value={message} onChange={e => setMessage(e.target.value)} className="flex-1" />
        <Button variant="gradient" size="sm"><Send className="h-3.5 w-3.5" />Diffuser</Button>
      </div>
    </div>
  );

  const templatesTab = (
    <div className="space-y-2">
      {templates.map(tpl => (
        <Card key={tpl.id} hover padding="sm" className="cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-mc-green-50 dark:bg-mc-green-900/30 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-mc-green-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{tpl.title}</p>
              <p className="text-xs text-[var(--text-muted)] truncate">{tpl.text}</p>
            </div>
            <Button variant="outline" size="sm">Utiliser</Button>
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
            <p className="text-lg font-bold text-white">{conversations.length}</p>
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

      <ContentTabs tabs={tabs} />
    </AnimatedPage>
  );
}
