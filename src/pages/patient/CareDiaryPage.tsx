import { useState } from 'react';
import { BookOpen, Camera, Plus, Calendar } from 'lucide-react';
import { Card, Badge, Button, AnimatedPage, GradientHeader } from '@/design-system';

const moods = [
  { emoji: '😫', label: 'Très mal', value: 1, color: 'bg-red-500' },
  { emoji: '😟', label: 'Mal', value: 2, color: 'bg-mc-amber-500' },
  { emoji: '😐', label: 'Moyen', value: 3, color: 'bg-yellow-400' },
  { emoji: '🙂', label: 'Bien', value: 4, color: 'bg-mc-green-400' },
  { emoji: '😊', label: 'Très bien', value: 5, color: 'bg-mc-green-500' },
];

const painLocations = ['Dos', 'Jambes', 'Bras', 'Abdomen', 'Tête', 'Plaie'];

const diaryEntries = [
  { id: 'd1', date: '06/03', mood: 4, pain: 3, painLoc: 'Dos', note: 'Nuit correcte, légère douleur au réveil.', hasPhoto: false },
  { id: 'd2', date: '05/03', mood: 3, pain: 5, painLoc: 'Plaie', note: 'Plaie un peu rouge, signalé à Marie.', hasPhoto: true },
  { id: 'd3', date: '04/03', mood: 4, pain: 2, painLoc: '', note: 'Bonne journée, marché 10 min.', hasPhoto: false },
  { id: 'd4', date: '03/03', mood: 2, pain: 6, painLoc: 'Dos', note: 'Mauvaise nuit, douleur intense au dos.', hasPhoto: false },
  { id: 'd5', date: '02/03', mood: 3, pain: 4, painLoc: 'Jambes', note: 'Jambes lourdes après la toilette.', hasPhoto: false },
];

export function CareDiaryPage() {
  const [painLevel, setPainLevel] = useState(3);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [selectedLoc, setSelectedLoc] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [showForm, setShowForm] = useState(false);

  return (
    <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <GradientHeader
        icon={<BookOpen className="h-5 w-5" />}
        title="Mon Journal de Soins"
        subtitle="Suivez vos symptômes au quotidien"
        badge={<Button variant="outline" size="sm" className="text-white border-white/30 hover:bg-white/10" onClick={() => setShowForm(!showForm)}><Plus className="h-3.5 w-3.5" />Nouvelle entrée</Button>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{diaryEntries.length}</p>
            <p className="text-[10px] text-white/60">Entrées</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">3.2</p>
            <p className="text-[10px] text-white/60">Humeur moy.</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">4.0</p>
            <p className="text-[10px] text-white/60">Douleur moy.</p>
          </div>
        </div>
      </GradientHeader>

      {/* ── New Entry Form ── */}
      {showForm && (
        <Card className="border-2 border-mc-blue-500/30 space-y-4">
          <p className="text-sm font-bold">Nouvelle entrée — Aujourd'hui</p>

          {/* Mood tracker */}
          <div>
            <p className="text-xs font-medium mb-2">Comment vous sentez-vous ?</p>
            <div className="flex justify-between">
              {moods.map(m => (
                <button key={m.value} onClick={() => setSelectedMood(m.value)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${selectedMood === m.value ? 'bg-mc-blue-500/10 ring-2 ring-mc-blue-500' : ''}`}>
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-[9px] text-[var(--text-muted)]">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pain level */}
          <div>
            <p className="text-xs font-medium mb-2">Niveau de douleur</p>
            <input type="range" min="0" max="10" value={painLevel} onChange={e => setPainLevel(Number(e.target.value))}
              className="w-full accent-mc-blue-500" />
            <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
              <span>0 — Aucune</span>
              <span className={`text-base font-bold ${painLevel <= 3 ? 'text-mc-green-500' : painLevel <= 6 ? 'text-mc-amber-500' : 'text-red-500'}`}>{painLevel}</span>
              <span>10 — Maximale</span>
            </div>
          </div>

          {/* Pain location */}
          <div>
            <p className="text-xs font-medium mb-2">Localisation</p>
            <div className="flex flex-wrap gap-1.5">
              {painLocations.map(loc => (
                <button key={loc} onClick={() => setSelectedLoc(selectedLoc === loc ? null : loc)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium ${selectedLoc === loc ? 'bg-mc-blue-500 text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}>
                  {loc}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="text-xs font-medium mb-2">Notes pour l'infirmière</p>
            <textarea rows={2} value={note} onChange={e => setNote(e.target.value)}
              placeholder="Décrivez comment vous vous sentez..."
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-mc-blue-500/50" />
          </div>

          {/* Photo */}
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[var(--border-default)] w-full hover:bg-[var(--bg-tertiary)] transition-colors">
            <Camera className="h-4 w-4 text-[var(--text-muted)]" />
            <span className="text-xs text-[var(--text-muted)]">Ajouter une photo (plaie, rougeur...)</span>
          </button>

          <Button variant="gradient" className="w-full" onClick={() => setShowForm(false)}>Enregistrer</Button>
        </Card>
      )}

      {/* ── History Timeline ── */}
      <div className="relative pl-6 space-y-3">
        <div className="absolute left-[9px] top-1 bottom-1 w-px bg-[var(--border-default)]" />
        {diaryEntries.map(entry => (
          <div key={entry.id} className="relative">
            <div className="absolute left-[-24px] top-1">
              <div className={`h-[18px] w-[18px] rounded-full flex items-center justify-center text-[10px] ${moods[entry.mood - 1]?.color ?? 'bg-gray-400'}`}>
                <span>{moods[entry.mood - 1]?.emoji ?? '?'}</span>
              </div>
            </div>
            <Card padding="sm">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-[var(--text-muted)]" />
                  <span className="text-xs font-bold">{entry.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={entry.pain <= 3 ? 'green' : entry.pain <= 6 ? 'amber' : 'red'}>
                    Douleur: {entry.pain}/10
                  </Badge>
                  {entry.hasPhoto && <Badge variant="blue">📷</Badge>}
                </div>
              </div>
              {entry.painLoc && <p className="text-[10px] text-[var(--text-muted)] mb-1">📍 {entry.painLoc}</p>}
              <p className="text-xs text-[var(--text-secondary)]">{entry.note}</p>
            </Card>
          </div>
        ))}
      </div>
    </AnimatedPage>
  );
}
