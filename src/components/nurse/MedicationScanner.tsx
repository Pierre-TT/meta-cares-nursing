import { useState } from 'react';
import { ScanBarcode, Check, AlertTriangle, X, Pill } from 'lucide-react';
import { Card, Badge, Button } from '@/design-system';

type ScanResult = {
  cnk: string;
  name: string;
  dci: string;
  dosage: string;
  matchesVitalink: boolean;
  vitalinkEntry?: string;
  alert?: string;
};

export function MedicationScanner({ className = '' }: { className?: string }) {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  const simulateScan = () => {
    setScanning(true);
    setResult(null);
    setTimeout(() => {
      setResult({
        cnk: '2345678',
        name: 'Metformine Sandoz 850 mg',
        dci: 'Metformine',
        dosage: '850 mg',
        matchesVitalink: true,
        vitalinkEntry: '1 co matin + 1 co soir — Pendant le repas',
      });
      setScanning(false);
    }, 1500);
  };

  const simulateMismatch = () => {
    setScanning(true);
    setResult(null);
    setTimeout(() => {
      setResult({
        cnk: '9999999',
        name: 'Amoxicilline 500 mg',
        dci: 'Amoxicilline',
        dosage: '500 mg',
        matchesVitalink: false,
        alert: 'ALLERGIE DÉTECTÉE — Pénicilline (rash cutané). Ce médicament ne figure pas dans le schéma Vitalink du patient.',
      });
      setScanning(false);
    }, 1500);
  };

  return (
    <Card className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <ScanBarcode className="h-4 w-4 text-mc-blue-500" />
        <span className="text-sm font-semibold">Scanner médicament</span>
        <Badge variant="blue">Vitalink</Badge>
      </div>

      {/* Scanner area */}
      <div className="h-32 rounded-xl border-2 border-dashed border-[var(--border-default)] flex flex-col items-center justify-center gap-2 bg-[var(--bg-tertiary)]">
        {scanning ? (
          <>
            <ScanBarcode className="h-10 w-10 text-mc-blue-500 animate-pulse" />
            <span className="text-xs text-[var(--text-muted)]">Scan en cours…</span>
          </>
        ) : (
          <>
            <ScanBarcode className="h-10 w-10 text-[var(--text-muted)]" />
            <span className="text-xs text-[var(--text-muted)]">Scannez le code-barres du médicament</span>
          </>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="gradient" size="sm" className="flex-1 gap-1" onClick={simulateScan} disabled={scanning}>
          <ScanBarcode className="h-3.5 w-3.5" /> Scanner
        </Button>
        <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={simulateMismatch} disabled={scanning}>
          <AlertTriangle className="h-3.5 w-3.5" /> Test alerte
        </Button>
      </div>

      {/* Result */}
      {result && (
        <div className={`p-3 rounded-lg ${result.matchesVitalink ? 'bg-mc-green-500/10' : 'bg-mc-red-500/10'}`}>
          <div className="flex items-center gap-2 mb-2">
            {result.matchesVitalink ? (
              <Check className="h-5 w-5 text-mc-green-500" />
            ) : (
              <X className="h-5 w-5 text-mc-red-500" />
            )}
            <span className="font-semibold text-sm">
              {result.matchesVitalink ? 'Conforme Vitalink ✓' : 'NON CONFORME ✗'}
            </span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <Pill className="h-3 w-3 text-[var(--text-muted)]" />
              <span className="font-medium">{result.name}</span>
            </div>
            <p className="text-[var(--text-muted)]">DCI: {result.dci} · CNK: {result.cnk}</p>
            {result.vitalinkEntry && (
              <p className="text-mc-green-500">Posologie: {result.vitalinkEntry}</p>
            )}
            {result.alert && (
              <p className="text-mc-red-500 font-medium">{result.alert}</p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
