import { supabase } from '@/lib/supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ExtractedVitals {
  glycemia?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  weight?: number;
  pain?: number;
}

export interface AISoapNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface AIVoiceNoteResult {
  soapNote: AISoapNote;
  extractedVitals: ExtractedVitals;
  /** INAMI nomenclature codes suggested by keyword matching */
  suggestedActCodes: string[];
  /** Human-readable clinical alerts derived from the transcript */
  clinicalAlerts: string[];
}

export interface PatientContext {
  allergies?: string[];
  katzCategory?: string;
  pathologies?: string[];
}

// ── Client ────────────────────────────────────────────────────────────────────

/**
 * Sends the voice transcript to the `ai-voice-note` Supabase Edge Function.
 *
 * The function:
 * 1. Always runs regex-based vital extraction and INAMI act-code detection.
 * 2. Builds clinical alerts (hyper/hypoglycemia, low SpO₂, falls, etc.).
 * 3. Tries to generate a structured SOAP note via OpenAI if `OPENAI_API_KEY`
 *    is set in the function's environment; falls back to local NLP otherwise.
 *
 * This means the feature works out-of-the-box — the AI SOAP note is a bonus.
 */
export async function analyzeVoiceNote(
  transcript: string,
  patientContext?: PatientContext,
): Promise<AIVoiceNoteResult> {
  const { data, error } = await supabase.functions.invoke<AIVoiceNoteResult>(
    'ai-voice-note',
    { body: { transcript, patientContext } },
  );

  if (error) throw error;
  if (!data) throw new Error('Réponse IA vide');

  return data;
}
