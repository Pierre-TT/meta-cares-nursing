import { useState } from 'react';
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, MessageSquare, Monitor, User, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, Button, AnimatedPage } from '@/design-system';

interface ScheduledCall {
  id: string;
  patient: string;
  date: string;
  time: string;
  type: 'follow_up' | 'wound_check' | 'parameter_review' | 'education';
  status: 'scheduled' | 'completed' | 'missed';
}

const scheduledCalls: ScheduledCall[] = [
  { id: '1', patient: 'Janssens Maria', date: '06/03/2025', time: '14:00', type: 'wound_check', status: 'scheduled' },
  { id: '2', patient: 'Van Damme Pierre', date: '06/03/2025', time: '15:30', type: 'parameter_review', status: 'scheduled' },
  { id: '3', patient: 'Dubois Françoise', date: '05/03/2025', time: '10:00', type: 'follow_up', status: 'completed' },
  { id: '4', patient: 'Peeters Jan', date: '04/03/2025', time: '11:00', type: 'education', status: 'missed' },
];

const typeLabels = {
  follow_up: 'Suivi général',
  wound_check: 'Contrôle plaie',
  parameter_review: 'Revue paramètres',
  education: 'Éducation patient',
};

export function TeleconsultationPage() {
  const [inCall, setInCall] = useState(false);
  const [videoOn, setVideoOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [callTimer, setCallTimer] = useState(0);

  const startCall = () => {
    setInCall(true);
    const interval = setInterval(() => setCallTimer(t => t + 1), 1000);
    // Store interval id for cleanup (simplified)
    (window as unknown as Record<string, unknown>).__teleconsInterval = interval;
  };

  const endCall = () => {
    setInCall(false);
    setCallTimer(0);
    const interval = (window as unknown as Record<string, unknown>).__teleconsInterval as ReturnType<typeof setInterval>;
    if (interval) clearInterval(interval);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  if (inCall) {
    return (
      <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-4">
        {/* Video area */}
        <div className="relative rounded-2xl bg-gray-900 h-80 flex items-center justify-center overflow-hidden">
          {videoOn ? (
            <div className="text-center text-white">
              <div className="h-20 w-20 rounded-full bg-mc-blue-500/30 flex items-center justify-center mx-auto mb-3">
                <User className="h-10 w-10 text-white" />
              </div>
              <p className="font-medium">Janssens Maria</p>
              <p className="text-sm text-gray-400">Connecté</p>
            </div>
          ) : (
            <div className="text-white text-center">
              <VideoOff className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Caméra désactivée</p>
            </div>
          )}

          {/* Self preview */}
          <div className="absolute bottom-3 right-3 h-24 w-20 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center">
            <User className="h-6 w-6 text-gray-500" />
          </div>

          {/* Timer */}
          <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 text-white text-sm">
            <div className="h-2 w-2 rounded-full bg-mc-red-500 animate-pulse" />
            {formatTime(callTimer)}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setMicOn(!micOn)}
            className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${micOn ? 'bg-[var(--bg-tertiary)]' : 'bg-mc-red-500 text-white'}`}
          >
            {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </button>
          <button
            onClick={() => setVideoOn(!videoOn)}
            className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${videoOn ? 'bg-[var(--bg-tertiary)]' : 'bg-mc-red-500 text-white'}`}
          >
            {videoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </button>
          <button className="h-12 w-12 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
            <Monitor className="h-5 w-5" />
          </button>
          <button className="h-12 w-12 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
            <MessageSquare className="h-5 w-5" />
          </button>
          <button
            onClick={endCall}
            className="h-12 w-12 rounded-full bg-mc-red-500 text-white flex items-center justify-center"
          >
            <PhoneOff className="h-5 w-5" />
          </button>
        </div>

        {/* Quick actions during call */}
        <Card>
          <CardHeader><CardTitle>Actions rapides</CardTitle></CardHeader>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">Prendre photo plaie</Button>
            <Button variant="outline" size="sm">Noter paramètres</Button>
            <Button variant="outline" size="sm">Partager document</Button>
          </div>
        </Card>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Téléconsultation</h1>
        <Badge variant="green">mHealth</Badge>
      </div>

      <Card glass>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-mc-blue-500 to-mc-green-500 flex items-center justify-center">
            <Video className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-semibold">Appel rapide</p>
            <p className="text-xs text-[var(--text-muted)]">Démarrer une téléconsultation immédiate</p>
          </div>
          <Button variant="gradient" size="sm" className="ml-auto gap-1" onClick={startCall}>
            <Phone className="h-3.5 w-3.5" /> Appeler
          </Button>
        </div>
      </Card>

      <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide">Programmées</h2>
      {scheduledCalls.filter(c => c.status === 'scheduled').map(call => (
        <Card key={call.id} className="hover:ring-2 hover:ring-mc-blue-500/20 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-mc-blue-500/10 flex items-center justify-center">
                <User className="h-5 w-5 text-mc-blue-500" />
              </div>
              <div>
                <p className="font-medium text-sm">{call.patient}</p>
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <Calendar className="h-3 w-3" />
                  <span>{call.date} à {call.time}</span>
                </div>
                <Badge variant="blue" className="mt-0.5">{typeLabels[call.type]}</Badge>
              </div>
            </div>
            <Button variant="gradient" size="sm" className="gap-1" onClick={startCall}>
              <Video className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>
      ))}

      <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mt-4">Historique</h2>
      {scheduledCalls.filter(c => c.status !== 'scheduled').map(call => (
        <Card key={call.id} className="opacity-75">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{call.patient}</p>
              <p className="text-xs text-[var(--text-muted)]">{call.date} · {typeLabels[call.type]}</p>
            </div>
            <Badge variant={call.status === 'completed' ? 'green' : 'red'}>
              {call.status === 'completed' ? 'Terminé' : 'Manqué'}
            </Badge>
          </div>
        </Card>
      ))}
    </AnimatedPage>
  );
}
