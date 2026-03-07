import { useState } from 'react';
import { Accessibility, Type, Contrast, Volume2 } from 'lucide-react';
import { Card } from '@/design-system';

type FontSize = 'normal' | 'large' | 'xl';

export function AccessibilityPanel() {
  const [fontSize, setFontSize] = useState<FontSize>('normal');
  const [highContrast, setHighContrast] = useState(false);
  const [voiceReadout, setVoiceReadout] = useState(false);

  const fontSizes: { value: FontSize; label: string }[] = [
    { value: 'normal', label: 'Normal' },
    { value: 'large', label: 'Grand' },
    { value: 'xl', label: 'Très grand' },
  ];

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <Accessibility className="h-5 w-5 text-mc-blue-500" />
        <p className="text-sm font-bold">Accessibilité</p>
      </div>

      <div className="space-y-3">
        {/* Font size */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Type className="h-3.5 w-3.5 text-[var(--text-muted)]" />
            <span className="text-xs font-medium">Taille du texte</span>
          </div>
          <div className="flex gap-1.5">
            {fontSizes.map(fs => (
              <button key={fs.value} onClick={() => setFontSize(fs.value)}
                className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  fontSize === fs.value ? 'bg-mc-blue-500 text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                }`}>
                {fs.label}
              </button>
            ))}
          </div>
        </div>

        {/* High contrast */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Contrast className="h-3.5 w-3.5 text-[var(--text-muted)]" />
            <span className="text-xs font-medium">Contraste élevé</span>
          </div>
          <button onClick={() => setHighContrast(!highContrast)}
            className={`relative h-6 w-11 rounded-full transition-colors ${highContrast ? 'bg-mc-blue-500' : 'bg-[var(--bg-tertiary)]'}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${highContrast ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* Voice readout */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="h-3.5 w-3.5 text-[var(--text-muted)]" />
            <span className="text-xs font-medium">Lecture vocale</span>
          </div>
          <button onClick={() => setVoiceReadout(!voiceReadout)}
            className={`relative h-6 w-11 rounded-full transition-colors ${voiceReadout ? 'bg-mc-blue-500' : 'bg-[var(--bg-tertiary)]'}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${voiceReadout ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>
    </Card>
  );
}
