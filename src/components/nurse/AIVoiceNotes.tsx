import { useState } from 'react';
import { Mic, MicOff, Sparkles, Copy, Check } from 'lucide-react';
import { Card, Badge } from '@/design-system';

interface AIVoiceNotesProps {
  onTranscript?: (text: string) => void;
  className?: string;
}

export function AIVoiceNotes({ onTranscript, className = '' }: AIVoiceNotesProps) {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [copied, setCopied] = useState(false);

  const toggleRecording = () => {
    if (!recording) {
      setRecording(true);
      // Simulate voice recognition
      setTimeout(() => {
        const demo = 'Patient stable ce matin. Glycémie à jeun 132 mg/dL, dans les normes. Toilette complète effectuée avec aide partielle. Pansement plaie jambe gauche renouvelé — bourgeonnement visible, bon aspect. Pilulier préparé pour la semaine.';
        setTranscript(demo);
        setRecording(false);
        // AI summary with delay
        setTimeout(() => {
          setAiSummary('• Glycémie: 132 mg/dL (normal)\n• Toilette complète (aide partielle)\n• Plaie jambe G: bourgeonnement ✓\n• Pilulier préparé');
          onTranscript?.(demo);
        }, 800);
      }, 3000);
    } else {
      setRecording(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-mc-amber-500" />
          <span className="text-sm font-semibold">Notes vocales IA</span>
          <Badge variant="amber">Beta</Badge>
        </div>
      </div>

      {/* Mic button */}
      <div className="flex justify-center">
        <button
          onClick={toggleRecording}
          className={`h-16 w-16 rounded-full flex items-center justify-center transition-all ${
            recording
              ? 'bg-mc-red-500 text-white animate-pulse shadow-lg shadow-mc-red-500/30'
              : 'bg-[image:var(--gradient-brand)] text-white shadow-lg shadow-mc-blue-500/30 hover:scale-105'
          }`}
        >
          {recording ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
        </button>
      </div>

      <p className="text-xs text-center text-[var(--text-muted)]">
        {recording ? 'Écoute en cours… Parlez naturellement.' : 'Appuyez pour dicter vos observations'}
      </p>

      {/* Transcript */}
      {transcript && (
        <div className="p-3 rounded-lg bg-[var(--bg-tertiary)] text-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-muted)]">Transcription</span>
            <button onClick={handleCopy} className="text-xs text-mc-blue-500 flex items-center gap-1">
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
          <p>{transcript}</p>
        </div>
      )}

      {/* AI Summary */}
      {aiSummary && (
        <div className="p-3 rounded-lg bg-mc-blue-500/10 text-sm space-y-1">
          <div className="flex items-center gap-1 text-xs font-medium text-mc-blue-500">
            <Sparkles className="h-3 w-3" /> Résumé IA
          </div>
          <pre className="text-xs whitespace-pre-wrap font-sans">{aiSummary}</pre>
        </div>
      )}
    </Card>
  );
}
