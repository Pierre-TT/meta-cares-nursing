import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Loader2,
  Mic,
  MicOff,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import { Badge, Button, Card } from '@/design-system';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import {
  analyzeVoiceNote,
  type AIVoiceNoteResult,
  type ExtractedVitals,
  type PatientContext,
} from '@/lib/aiVoiceNote';

interface AIVoiceNotesProps {
  /** Called with the raw transcript when recording stops */
  onTranscript?: (text: string) => void;
  /** Called with structured vitals so the parent can pre-fill form fields */
  onVitalsExtracted?: (vitals: ExtractedVitals) => void;
  /** Called with INAMI act codes so the parent can pre-select them */
  onActsExtracted?: (codes: string[]) => void;
  /** Optional patient data to give the AI more context */
  patientContext?: PatientContext;
  className?: string;
}

export function AIVoiceNotes({
  onTranscript,
  onVitalsExtracted,
  onActsExtracted,
  patientContext,
  className = '',
}: AIVoiceNotesProps) {
  const voice = useVoiceRecognition('fr-BE');
  const [copied, setCopied] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AIVoiceNoteResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [soapExpanded, setSoapExpanded] = useState(false);

  // When recording stops and a transcript exists, run AI analysis.
  useEffect(() => {
    if (!voice.isRecording && voice.transcript) {
      void runAnalysis(voice.transcript);
    }
    // We only want this to fire on the isRecording transition, not on every
    // transcript character — so voice.transcript is intentionally omitted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.isRecording]);

  const runAnalysis = async (text: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const analysis = await analyzeVoiceNote(text, patientContext);
      setResult(analysis);
      onTranscript?.(text);
      if (Object.keys(analysis.extractedVitals).length > 0) {
        onVitalsExtracted?.(analysis.extractedVitals);
      }
      if (analysis.suggestedActCodes.length > 0) {
        onActsExtracted?.(analysis.suggestedActCodes);
      }
    } catch {
      setAnalysisError('Analyse IA indisponible — vérifiez que la fonction Edge est déployée.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggle = () => {
    if (voice.isRecording) {
      voice.stop();
    } else {
      // Clear previous session before starting a new one.
      voice.reset();
      setResult(null);
      setAnalysisError(null);
      setSoapExpanded(false);
      voice.start();
    }
  };

  const handleCopy = () => {
    const text = result
      ? `S: ${result.soapNote.subjective}\nO: ${result.soapNote.objective}\nA: ${result.soapNote.assessment}\nP: ${result.soapNote.plan}`
      : voice.transcript;
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasContent = !!(voice.transcript || voice.isRecording);
  const vitalsCount = result ? Object.keys(result.extractedVitals).length : 0;

  return (
    <Card className={`space-y-3 ${className}`}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-mc-amber-500" />
          <span className="text-sm font-semibold">Notes vocales IA</span>
          {voice.isSupported ? (
            <Badge variant="green">Actif</Badge>
          ) : (
            <Badge variant="amber">Non supporté</Badge>
          )}
        </div>
        {hasContent && (
          <button onClick={handleCopy} className="text-xs text-mc-blue-500 flex items-center gap-1">
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copié' : 'Copier'}
          </button>
        )}
      </div>

      {/* Browser not supported warning */}
      {!voice.isSupported && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-mc-amber-50 dark:bg-amber-900/20 text-xs text-mc-amber-700 dark:text-amber-300">
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
          Utilisez Chrome ou Safari pour activer la reconnaissance vocale
        </div>
      )}

      {/* ── Mic button + waveform ── */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={handleToggle}
          disabled={!voice.isSupported || isAnalyzing}
          className={`h-16 w-16 rounded-full flex items-center justify-center transition-all
            disabled:opacity-40 disabled:cursor-not-allowed ${
            voice.isRecording
              ? 'bg-mc-red-500 text-white shadow-lg shadow-mc-red-500/30'
              : 'bg-[image:var(--gradient-brand)] text-white shadow-lg shadow-mc-blue-500/30 hover:scale-105'
          }`}
        >
          {isAnalyzing
            ? <Loader2 className="h-7 w-7 animate-spin" />
            : voice.isRecording
              ? <MicOff className="h-7 w-7" />
              : <Mic className="h-7 w-7" />
          }
        </button>

        {/* Animated waveform bars while recording */}
        {voice.isRecording && (
          <div className="flex items-center gap-0.5 h-5">
            {[3, 6, 10, 7, 4, 9, 5].map((h, i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-mc-red-500 animate-pulse"
                style={{
                  height: `${h}px`,
                  animationDelay: `${i * 80}ms`,
                  animationDuration: `${400 + (i % 3) * 150}ms`,
                }}
              />
            ))}
          </div>
        )}

        <p className="text-xs text-center text-[var(--text-muted)]">
          {isAnalyzing
            ? 'Analyse IA en cours…'
            : voice.isRecording
              ? 'Parlez naturellement — appuyez pour arrêter'
              : voice.transcript
                ? 'Nouvelle dictée : appuyez pour recommencer'
                : 'Appuyez pour dicter vos observations'}
        </p>
      </div>

      {/* ── Live interim text ── */}
      {voice.isRecording && voice.interimTranscript && (
        <div className="p-2.5 rounded-xl bg-mc-blue-500/5 border border-mc-blue-500/15 text-xs text-[var(--text-muted)] italic leading-relaxed min-h-8">
          {voice.interimTranscript}…
        </div>
      )}

      {/* ── Final transcript ── */}
      {voice.transcript && !voice.isRecording && (
        <div className="p-3 rounded-lg bg-[var(--bg-tertiary)] text-sm space-y-1">
          <span className="text-xs font-medium text-[var(--text-muted)]">Transcription</span>
          <p className="leading-relaxed">{voice.transcript}</p>
        </div>
      )}

      {/* ── Analysis error ── */}
      {analysisError && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-mc-amber-50 dark:bg-amber-900/20 text-xs text-mc-amber-700 dark:text-amber-200">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {analysisError}
        </div>
      )}

      {/* ── AI Results ── */}
      {result && (
        <div className="space-y-2">
          {/* Clinical alerts */}
          {result.clinicalAlerts.length > 0 && (
            <div className="space-y-1">
              {result.clinicalAlerts.map((alert, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-2 rounded-lg bg-mc-red-500/10 text-xs text-mc-red-600 dark:text-red-300"
                >
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  {alert}
                </div>
              ))}
            </div>
          )}

          {/* Extracted vitals */}
          {vitalsCount > 0 && (
            <div className="p-3 rounded-xl bg-mc-green-500/10 space-y-2">
              <p className="text-xs font-semibold text-mc-green-600 dark:text-mc-green-400 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> {vitalsCount} paramètre{vitalsCount > 1 ? 's' : ''} détecté{vitalsCount > 1 ? 's' : ''}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result.extractedVitals.glycemia !== undefined && (
                  <Badge variant={result.extractedVitals.glycemia > 200 || result.extractedVitals.glycemia < 70 ? 'amber' : 'green'}>
                    Glycémie: {result.extractedVitals.glycemia} mg/dL
                  </Badge>
                )}
                {result.extractedVitals.bloodPressureSystolic !== undefined && (
                  <Badge variant="green">
                    TA: {result.extractedVitals.bloodPressureSystolic}/{result.extractedVitals.bloodPressureDiastolic}
                  </Badge>
                )}
                {result.extractedVitals.heartRate !== undefined && (
                  <Badge variant="green">FC: {result.extractedVitals.heartRate} bpm</Badge>
                )}
                {result.extractedVitals.temperature !== undefined && (
                  <Badge variant={result.extractedVitals.temperature >= 38.5 ? 'amber' : 'green'}>
                    T°: {result.extractedVitals.temperature}°C
                  </Badge>
                )}
                {result.extractedVitals.oxygenSaturation !== undefined && (
                  <Badge variant={result.extractedVitals.oxygenSaturation < 92 ? 'red' : 'green'}>
                    SpO₂: {result.extractedVitals.oxygenSaturation}%
                  </Badge>
                )}
                {result.extractedVitals.weight !== undefined && (
                  <Badge variant="green">Poids: {result.extractedVitals.weight} kg</Badge>
                )}
                {result.extractedVitals.pain !== undefined && (
                  <Badge variant={result.extractedVitals.pain >= 7 ? 'red' : 'amber'}>
                    Douleur: {result.extractedVitals.pain}/10
                  </Badge>
                )}
              </div>
              {onVitalsExtracted && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onVitalsExtracted(result.extractedVitals)}
                >
                  ↑ Pré-remplir les paramètres vitaux
                </Button>
              )}
            </div>
          )}

          {/* Suggested act codes */}
          {result.suggestedActCodes.length > 0 && onActsExtracted && (
            <div className="p-3 rounded-xl bg-mc-blue-500/10 space-y-2">
              <p className="text-xs font-semibold text-mc-blue-600 dark:text-mc-blue-400">
                Actes suggérés
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result.suggestedActCodes.map((code) => (
                  <Badge key={code} variant="blue">{code}</Badge>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => onActsExtracted(result.suggestedActCodes)}
              >
                ↑ Pré-sélectionner les actes
              </Button>
            </div>
          )}

          {/* SOAP note (collapsible) */}
          <div className="rounded-xl bg-mc-blue-500/10 overflow-hidden">
            <button
              onClick={() => setSoapExpanded((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-left"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-mc-blue-600 dark:text-mc-blue-400">
                <Sparkles className="h-3 w-3" />
                Note SOAP générée
              </div>
              {soapExpanded
                ? <ChevronUp className="h-4 w-4 text-mc-blue-500" />
                : <ChevronDown className="h-4 w-4 text-mc-blue-500" />
              }
            </button>
            {soapExpanded && (
              <div className="px-3 pb-3 space-y-3">
                {([
                  { key: 'subjective', label: 'S – Subjectif' },
                  { key: 'objective',  label: 'O – Objectif' },
                  { key: 'assessment', label: 'A – Évaluation' },
                  { key: 'plan',       label: 'P – Plan' },
                ] as const).map(({ key, label }) => (
                  <div key={key}>
                    <span className="text-[10px] font-bold tracking-wider uppercase text-mc-blue-600 dark:text-mc-blue-400">
                      {label}
                    </span>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                      {result.soapNote[key]}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
