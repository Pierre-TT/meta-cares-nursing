import { useState } from 'react';
import { MessageCircle, Send, Paperclip, Image, Pin, Users, User, ChevronLeft, Search } from 'lucide-react';
import { Card, Badge, Input, Avatar, AnimatedPage, GradientHeader } from '@/design-system';

interface Conversation {
  id: string;
  name: string;
  type: 'team' | 'direct' | 'patient';
  lastMessage: string;
  lastTime: string;
  unread: number;
  pinned: boolean;
  avatar?: string;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isMe: boolean;
  attachment?: { type: 'image' | 'file'; name: string };
}

const conversations: Conversation[] = [
  { id: '1', name: 'Équipe Bruxelles-Sud', type: 'team', lastMessage: 'Sophie: J\'ai terminé ma tournée, dispo pour dépannage', lastTime: '14:32', unread: 3, pinned: true },
  { id: '2', name: 'Coordination', type: 'team', lastMessage: 'Planning mis à jour pour demain — voir modifications', lastTime: '13:15', unread: 1, pinned: true },
  { id: '3', name: 'Sophie Laurent', type: 'direct', lastMessage: 'Tu peux me remplacer jeudi matin?', lastTime: '12:45', unread: 1, pinned: false },
  { id: '4', name: 'Marc Dupont', type: 'direct', lastMessage: 'OK merci pour l\'info sur Mme Dubois', lastTime: '11:30', unread: 0, pinned: false },
  { id: '5', name: 'Cas Janssens Maria', type: 'patient', lastMessage: 'Photo plaie J+7 envoyée — avis?', lastTime: '10:20', unread: 0, pinned: false },
  { id: '6', name: 'Cas Van Damme Pierre', type: 'patient', lastMessage: 'Glycémie instable, voir notes', lastTime: 'Hier', unread: 0, pinned: false },
];

const chatMessages: ChatMessage[] = [
  { id: 'm1', sender: 'Sophie Laurent', text: 'Bonjour l\'équipe ! Ma tournée se passe bien ce matin.', time: '08:15', isMe: false },
  { id: 'm2', sender: 'Marc Dupont', text: 'Pareil ici. Par contre Mme Dubois a une TA un peu élevée (155/95), je surveille.', time: '08:32', isMe: false },
  { id: 'm3', sender: 'Moi', text: 'Merci Marc. Tu peux lui proposer de mesurer à nouveau dans 30 min au repos?', time: '08:35', isMe: true },
  { id: 'm4', sender: 'Marc Dupont', text: 'Oui bonne idée, je ferai ça après le pilulier.', time: '08:37', isMe: false },
  { id: 'm5', sender: 'Sophie Laurent', text: 'J\'ai terminé ma tournée, dispo pour dépannage si besoin', time: '14:32', isMe: false },
  { id: 'm6', sender: 'Moi', text: 'Super Sophie ! Tu pourrais passer chez Peeters Jan cet après-midi? Il a une téléconsultation à préparer.', time: '14:35', isMe: true },
];

const typeConfig = {
  team: { icon: Users, label: 'Équipe', color: 'bg-mc-blue-500' },
  direct: { icon: User, label: 'Direct', color: 'bg-mc-green-500' },
  patient: { icon: MessageCircle, label: 'Patient', color: 'bg-mc-amber-500' },
};

export function TeamChatPage() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);
  const filtered = search
    ? conversations.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : conversations;

  if (selectedChat) {
    const conv = conversations.find(c => c.id === selectedChat);
    return (
      <AnimatedPage className="flex flex-col min-h-[calc(100dvh-5rem)] max-w-lg mx-auto">
        {/* Chat header */}
        <div className="px-4 py-3 border-b border-[var(--border-default)] flex items-center gap-3">
          <button onClick={() => setSelectedChat(null)} className="text-[var(--text-muted)]">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <Avatar name={conv?.name ?? ''} size="sm" />
          <div className="flex-1">
            <p className="text-sm font-semibold">{conv?.name}</p>
            <p className="text-[10px] text-[var(--text-muted)]">
              {conv?.type === 'team' ? '5 membres · En ligne' : 'En ligne'}
            </p>
          </div>
          {conv?.pinned && <Pin className="h-4 w-4 text-mc-amber-500" />}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {chatMessages.map(msg => (
            <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${msg.isMe ? 'order-2' : ''}`}>
                {!msg.isMe && (
                  <p className="text-[10px] font-medium text-[var(--text-muted)] mb-0.5 ml-1">{msg.sender}</p>
                )}
                <div className={`px-3 py-2 rounded-2xl text-sm ${
                  msg.isMe
                    ? 'bg-[image:var(--gradient-brand)] text-white rounded-br-md'
                    : 'bg-[var(--bg-tertiary)] rounded-bl-md'
                }`}>
                  {msg.text}
                </div>
                {msg.attachment && (
                  <div className="mt-1 px-2 py-1 rounded-lg bg-[var(--bg-tertiary)] text-xs flex items-center gap-1">
                    <Image className="h-3 w-3" />
                    {msg.attachment.name}
                  </div>
                )}
                <p className={`text-[10px] text-[var(--text-muted)] mt-0.5 ${msg.isMe ? 'text-right' : ''}`}>
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-[var(--border-default)] flex items-center gap-2">
          <button className="h-9 w-9 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
            <Paperclip className="h-4 w-4 text-[var(--text-muted)]" />
          </button>
          <input
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Votre message..."
            className="flex-1 px-3 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm outline-none focus:ring-2 focus:ring-mc-blue-500/50"
          />
          <button className="h-9 w-9 rounded-lg bg-[image:var(--gradient-brand)] flex items-center justify-center shrink-0">
            <Send className="h-4 w-4 text-white" />
          </button>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <GradientHeader
        icon={<MessageCircle className="h-5 w-5" />}
        title="Messages d'équipe"
        subtitle="Communication interne"
        badge={totalUnread > 0 ? <Badge variant="blue">{totalUnread} non lu{totalUnread > 1 ? 's' : ''}</Badge> : undefined}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{conversations.length}</p>
            <p className="text-[10px] text-white/60">Conversations</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{totalUnread}</p>
            <p className="text-[10px] text-white/60">Non lus</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{conversations.filter(c => c.pinned).length}</p>
            <p className="text-[10px] text-white/60">Épinglés</p>
          </div>
        </div>
      </GradientHeader>

      <Input
        placeholder="Rechercher une conversation..."
        icon={<Search className="h-4 w-4" />}
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="space-y-2">
        {filtered.map(conv => {
          const cfg = typeConfig[conv.type];
          return (
            <Card
              key={conv.id}
              hover
              padding="sm"
              className={`cursor-pointer ${conv.unread > 0 ? 'border-l-4 border-l-mc-blue-500' : ''}`}
              onClick={() => setSelectedChat(conv.id)}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar name={conv.name} size="md" />
                  <div className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full ${cfg.color} flex items-center justify-center`}>
                    <cfg.icon className="h-2.5 w-2.5 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm truncate ${conv.unread > 0 ? 'font-bold' : 'font-medium'}`}>{conv.name}</p>
                    {conv.pinned && <Pin className="h-3 w-3 text-mc-amber-500 shrink-0" />}
                  </div>
                  <p className={`text-xs truncate ${conv.unread > 0 ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                    {conv.lastMessage}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-[var(--text-muted)]">{conv.lastTime}</p>
                  {conv.unread > 0 && (
                    <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-mc-blue-500 text-white text-[10px] font-bold mt-0.5">
                      {conv.unread}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </AnimatedPage>
  );
}
