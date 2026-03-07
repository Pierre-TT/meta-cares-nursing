import { useState } from 'react';
import { ScanLine, Camera, Upload, User, Clock, Eye } from 'lucide-react';
import { GradientHeader, Tabs, Card, Badge, Button, AnimatedPage } from '@/design-system';

type DocType = 'prescription' | 'lab_result' | 'report' | 'insurance' | 'consent' | 'other';
type ScanStatus = 'pending' | 'processing' | 'classified' | 'linked';

interface ScannedDocument {
  id: string;
  filename: string;
  docType: DocType;
  status: ScanStatus;
  patient?: string;
  scannedAt: string;
  ocrText?: string;
  confidence: number;
}

const docTypeLabels: Record<DocType, { label: string; emoji: string }> = {
  prescription: { label: 'Prescription', emoji: '📋' },
  lab_result: { label: 'Résultat labo', emoji: '🔬' },
  report: { label: 'Rapport médical', emoji: '📄' },
  insurance: { label: 'Document mutuelle', emoji: '🏥' },
  consent: { label: 'Consentement', emoji: '✍️' },
  other: { label: 'Autre', emoji: '📎' },
};

const statusConfig = {
  pending: { label: 'En attente', variant: 'default' as const },
  processing: { label: 'Analyse...', variant: 'blue' as const },
  classified: { label: 'Classé', variant: 'amber' as const },
  linked: { label: 'Lié au patient', variant: 'green' as const },
};

const recentScans: ScannedDocument[] = [
  { id: '1', filename: 'prescription_janssens_05032025.jpg', docType: 'prescription', status: 'linked', patient: 'Mme Janssens Marie', scannedAt: '05/03/2025 08:15', ocrText: 'Insuline Lantus 22U — Dr. Vermeersch — Validité: 3 mois', confidence: 94 },
  { id: '2', filename: 'labo_vandenberg_04032025.jpg', docType: 'lab_result', status: 'linked', patient: 'M. Van den Berg Pierre', scannedAt: '04/03/2025 14:30', ocrText: 'INR: 2.1 — Hb: 13.2 — Créat: 1.1', confidence: 91 },
  { id: '3', filename: 'rapport_dupont_04032025.jpg', docType: 'report', status: 'classified', patient: 'Mme Dupont Claire', scannedAt: '04/03/2025 11:00', ocrText: 'Bilan gériatrique — MMSE: 18/30 — GDS: 4/15', confidence: 87 },
  { id: '4', filename: 'mutuelle_maes_03032025.jpg', docType: 'insurance', status: 'linked', patient: 'M. Maes Johan', scannedAt: '03/03/2025 16:45', ocrText: 'Accord mutuelle O₂ thérapie — Réf: MC-2025-44521', confidence: 89 },
  { id: '5', filename: 'consentement_desmet_03032025.jpg', docType: 'consent', status: 'linked', patient: 'M. De Smet Luc', scannedAt: '03/03/2025 10:20', ocrText: 'Consentement éclairé — Soins stomie — Signé', confidence: 96 },
  { id: '6', filename: 'scan_unknown_02032025.jpg', docType: 'other', status: 'pending', scannedAt: '02/03/2025 09:00', confidence: 45 },
];

export function DocumentScannerPage() {
  const [tab, setTab] = useState('scan');
  const [selectedType, setSelectedType] = useState<DocType | null>(null);

  const linkedCount = recentScans.filter(d => d.status === 'linked').length;
  const pendingCount = recentScans.filter(d => d.status === 'pending' || d.status === 'classified').length;

  return (
    <AnimatedPage>
      <GradientHeader
        title="Scanner"
        subtitle="Numérisation & classification de documents"
        icon={<ScanLine className="h-5 w-5 text-white" />}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{recentScans.length}</p>
            <p className="text-[10px] text-white/60">Documents</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-mc-green-300">{linkedCount}</p>
            <p className="text-[10px] text-white/60">Liés</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-mc-amber-300">{pendingCount}</p>
            <p className="text-[10px] text-white/60">En attente</p>
          </div>
        </div>
      </GradientHeader>

      <div className="px-4 py-4 space-y-4 max-w-lg mx-auto">
        <Tabs
          tabs={[
            { id: 'scan', label: 'Scanner' },
            { id: 'recent', label: 'Récents' },
          ]}
          activeTab={tab}
          onChange={setTab}
        />

        {tab === 'scan' && (
          <div className="space-y-4">
            {/* Camera capture area */}
            <Card className="text-center py-8">
              <div className="mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br from-mc-blue-500 to-mc-green-500 flex items-center justify-center mb-4">
                <Camera className="h-10 w-10 text-white" />
              </div>
              <p className="text-sm font-semibold mb-1">Scanner un document</p>
              <p className="text-xs text-[var(--text-muted)] mb-4">Prenez une photo ou importez un fichier</p>
              <div className="flex gap-2 justify-center">
                <Button className="gap-2">
                  <Camera className="h-4 w-4" /> Photo
                </Button>
                <Button variant="outline" className="gap-2">
                  <Upload className="h-4 w-4" /> Importer
                </Button>
              </div>
            </Card>

            {/* Document type selection */}
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Type de document</p>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(docTypeLabels) as [DocType, { label: string; emoji: string }][]).map(([key, { label, emoji }]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedType(selectedType === key ? null : key)}
                    className={`py-3 px-2 rounded-xl border text-center transition-all ${
                      selectedType === key
                        ? 'border-mc-blue-500 bg-mc-blue-500/10 shadow-sm'
                        : 'border-[var(--border-default)] hover:border-mc-blue-500/50'
                    }`}
                  >
                    <p className="text-lg mb-0.5">{emoji}</p>
                    <p className="text-[10px] font-medium">{label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick tips */}
            <Card className="bg-mc-blue-500/5 border border-mc-blue-500/20">
              <p className="text-xs font-semibold text-mc-blue-500 mb-1">💡 Conseils pour un bon scan</p>
              <ul className="space-y-0.5 text-xs text-[var(--text-muted)]">
                <li>• Posez le document sur une surface plane et bien éclairée</li>
                <li>• Cadrez tout le document dans l'image</li>
                <li>• Évitez les reflets et les ombres</li>
                <li>• L'OCR fonctionne mieux avec du texte imprimé</li>
              </ul>
            </Card>
          </div>
        )}

        {tab === 'recent' && (
          <div className="space-y-2">
            {recentScans.map(doc => {
              const typeInfo = docTypeLabels[doc.docType];
              const stCfg = statusConfig[doc.status];
              return (
                <Card key={doc.id}>
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-lg shrink-0">
                      {typeInfo.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{typeInfo.label}</p>
                        <Badge variant={stCfg.variant}>{stCfg.label}</Badge>
                      </div>
                      {doc.patient && (
                        <p className="text-xs text-mc-blue-500 flex items-center gap-1 mt-0.5">
                          <User className="h-3 w-3" /> {doc.patient}
                        </p>
                      )}
                      {doc.ocrText && (
                        <p className="text-xs text-[var(--text-muted)] mt-1 truncate">{doc.ocrText}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[var(--text-muted)]">
                        <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {doc.scannedAt}</span>
                        <span>Confiance: {doc.confidence}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2 pt-2 border-t border-[var(--border-subtle)]">
                    <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs">
                      <Eye className="h-3 w-3" /> Voir
                    </Button>
                    {doc.status !== 'linked' && (
                      <Button size="sm" className="flex-1 gap-1 text-xs">
                        <User className="h-3 w-3" /> Lier au patient
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}
