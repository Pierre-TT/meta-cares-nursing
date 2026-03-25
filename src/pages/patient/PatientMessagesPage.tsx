import { useState } from 'react';
import { MessageCircle, Send, Mic, Image, ChevronLeft, Check, CheckCheck } from 'lucide-react';
import { Card, Badge, Avatar, AnimatedPage, GradientHeader } from '@/design-system';
import { featureFlags } from '@/lib/featureFlags';
import { MockFeatureNotice } from '@/components/MockFeatureNotice';

interface Conversation {
  id: string;
  name: string;
  role: string;
  lastMessage: string;
  time: string;
  unread: number;
}

interface Message {
  id: string;
  text: string;
  sender: 'patient' | 'other';
  time: string;
  status: 'sent' | 'delivered' | 'read';
}

const conversations: Conversation[] = [
  { id: 'c1', name: 'Marie Laurent', role: 'Infirmière', lastMessage: 'Je serai chez vous vers 10h30.', time: '08:15', unread: 1 },
  { id: 'c2', name: 'Coord. Sophie', role: 'Coordinatrice', lastMessage: 'Votre planning a été mis à jour.', time: 'Hier', unread: 0 },
  { id: 'c3', name: 'Dr. Dupont', role: 'Médecin traitant', lastMessage: 'Résultats disponibles.', time: '04/03', unread: 1 },
];

const mockMessages: Message[] = [
  { id: 'm1', text: 'Bonjour Jean, comment allez-vous ce matin ?', sender: 'other', time: '08:00', status: 'read' },
  { id: 'm2', text: 'Bonjour Marie, ça va merci. J\'ai un peu mal au dos.', sender: 'patient', time: '08:05', status: 'read' },
  { id: 'm3', text: 'D\'accord, je regarderai ça pendant la visite. Avez-vous pris vos médicaments ?', sender: 'other', time: '08:08', status: 'read' },
  { id: 'm4', text: 'Oui, Metformine et Lisinopril pris ce matin.', sender: 'patient', time: '08:10', status: 'delivered' },
  { id: 'm5', text: 'Parfait ! Je serai chez vous vers 10h30.', sender: 'other', time: '08:15', status: 'read' },
];

const quickReplies = ['Merci !', 'Bien reçu', 'D\'accord', 'Rappel SVP', 'À bientôt'];

const StatusIcon = ({ status }: { status: Message['status'] }) => {
  if (status === 'read') return <CheckCheck className="h-3 w-3 text-mc-blue-500" />;
  if (status === 'delivered') return <CheckCheck className="h-3 w-3 text-[var(--text-muted)]" />;
  return <Check className="h-3 w-3 text-[var(--text-muted)]" />;
};

export function PatientMessagesPage() {
  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [input, setInput] = useState('');

  if (!featureFlags.enableHealthcareMocks) {
    return <MockFeatureNotice feature="Messagerie patient" />;
  }

  const active = conversations.find(c => c.id === activeConvo);

  /* ── Chat view ── */
  if (active) {
    return (
      <AnimatedPage className="flex flex-col h-[calc(100dvh-8rem)] max-w-lg mx-auto">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-default)]">
          <button onClick={() => setActiveConvo(null)} className="p-1">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <Avatar name={active.name} size="sm" />
          <div className="flex-1">
            <p className="text-sm font-bold">{active.name}</p>
            <p className="text-[10px] text-mc-green-500">En ligne</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {mockMessages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'patient' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                msg.sender === 'patient'
                  ? 'bg-gradient-to-r from-mc-blue-500 to-mc-green-500 text-white rounded-br-sm'
                  : 'bg-[var(--bg-tertiary)] rounded-bl-sm'
              }`}>
                <p className="text-sm">{msg.text}</p>
                <div className={`flex items-center gap-1 justify-end mt-0.5 ${msg.sender === 'patient' ? 'text-white/60' : 'text-[var(--text-muted)]'}`}>
                  <span className="text-[9px]">{msg.time}</span>
                  {msg.sender === 'patient' && <StatusIcon status={msg.status} />}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick replies */}
        <div className="flex gap-1.5 px-4 py-1.5 overflow-x-auto">
          {quickReplies.map(qr => (
            <button key={qr} onClick={() => setInput(qr)} className="shrink-0 px-3 py-1 rounded-full bg-[var(--bg-tertiary)] text-xs font-medium hover:bg-mc-blue-500/10 transition-colors">
              {qr}
            </button>
          ))}
        </div>

        {/* Input bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-[var(--border-default)]">
          <button className="p-2 rounded-xl hover:bg-[var(--bg-tertiary)]">
            <Image className="h-5 w-5 text-[var(--text-muted)]" />
          </button>
          <button className="p-2 rounded-xl hover:bg-[var(--bg-tertiary)]">
            <Mic className="h-5 w-5 text-[var(--text-muted)]" />
          </button>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Écrire un message..."
            className="flex-1 px-3 py-2 rounded-full bg-[var(--bg-tertiary)] text-sm focus:outline-none focus:ring-2 focus:ring-mc-blue-500/50"
          />
          <button className="p-2.5 rounded-full bg-gradient-to-r from-mc-blue-500 to-mc-green-500">
            <Send className="h-4 w-4 text-white" />
          </button>
        </div>
      </AnimatedPage>
    );
  }

  /* ── Conversation list ── */
  return (
    <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <GradientHeader
        icon={<MessageCircle className="h-5 w-5" />}
        title="Messages"
        subtitle="Échangez avec votre équipe soignante"
        badge={conversations.reduce((s, c) => s + c.unread, 0) > 0
          ? <Badge variant="blue">{conversations.reduce((s, c) => s + c.unread, 0)} nouveau{conversations.reduce((s, c) => s + c.unread, 0) > 1 ? 'x' : ''}</Badge>
          : undefined}
      />

      <div className="space-y-2">
        {conversations.map(conv => (
          <Card key={conv.id} hover padding="sm" className="cursor-pointer" onClick={() => setActiveConvo(conv.id)}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar name={conv.name} size="md" />
                {conv.unread > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-mc-blue-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {conv.unread}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{conv.name}</p>
                  <span className="text-[10px] text-[var(--text-muted)]">{conv.time}</span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">{conv.role}</p>
                <p className={`text-xs truncate ${conv.unread > 0 ? 'font-medium text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                  {conv.lastMessage}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AnimatedPage>
  );
}
