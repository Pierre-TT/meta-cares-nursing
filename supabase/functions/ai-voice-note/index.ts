/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
} as const;

// ── Types ─────────────────────────────────────────────────────────────────────

interface PatientContext {
  allergies?: string[];
  katzCategory?: string;
  pathologies?: string[];
}

interface VoiceNoteRequest {
  transcript: string;
  patientContext?: PatientContext;
}

interface ExtractedVitals {
  glycemia?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  weight?: number;
  pain?: number;
}

interface SoapNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

interface VoiceNoteResponse {
  soapNote: SoapNote;
  extractedVitals: ExtractedVitals;
  suggestedActCodes: string[];
  clinicalAlerts: string[];
}

// ── Vital Extraction (regex, no API needed) ───────────────────────────────────

function extractVitals(transcript: string): ExtractedVitals {
  const t = transcript.toLowerCase();
  const vitals: ExtractedVitals = {};

  // Glycemia: "glycémie 132", "dextro 132", "132 mg/dl"
  const glyc = t.match(/(?:glyc[eé]mie|dextro|glyco)(?:\s+[àa])?\s*(\d{2,3})(?:\s*mg)?/);
  if (glyc) vitals.glycemia = parseInt(glyc[1], 10);

  // Blood pressure: "tension 120/80", "ta 12/8" (French shorthand)
  const bp = t.match(
    // eslint-disable-next-line no-useless-escape
    /(?:tension(?:\s+art[eé]rielle)?|ta|pression)(?:\s+[àa])?\s*(\d{2,3})\s*[\/\-]\s*(\d{2,3})/,
  );
  if (bp) {
    vitals.bloodPressureSystolic = parseInt(bp[1], 10);
    vitals.bloodPressureDiastolic = parseInt(bp[2], 10);
  }

  // Heart rate: "pouls 72", "fc 72", "fréquence cardiaque 72"
  const hr = t.match(/(?:pouls|fc|fr[eé]quence\s+cardiaque|rythme)(?:\s+[àa])?\s*(\d{2,3})/);
  if (hr) vitals.heartRate = parseInt(hr[1], 10);

  // Temperature: "température 36.8", "fièvre 38.5"
  const temp = t.match(/(?:temp[eé]rature|temp|fi[eè]vre)(?:\s+[àa])?\s*(\d{2}[.,]\d)/);
  if (temp) vitals.temperature = parseFloat(temp[1].replace(',', '.'));

  // SpO2: "spo2 98", "saturation 96%", "sat 98"
  const spo2 = t.match(/(?:spo2|saturation|sat\.?)(?:\s+[àa])?\s*(\d{2,3})\s*%?/);
  if (spo2) vitals.oxygenSaturation = parseInt(spo2[1], 10);

  // Weight: "poids 72 kg", "72 kilos"
  const wt = t.match(/(?:poids|p[eè]se)(?:\s+[àa])?\s*(\d{2,3}(?:[.,]\d)?)\s*(?:kg|kilos?)/);
  if (wt) vitals.weight = parseFloat(wt[1].replace(',', '.'));

  // Pain EVA: "douleur 4/10", "eva 3"
  const pain = t.match(/(?:douleur|eva|[eé]chelle)(?:\s+[àa])?\s*(\d{1,2})(?:\s*\/\s*10)?/);
  if (pain) {
    const val = parseInt(pain[1], 10);
    if (val <= 10) vitals.pain = val;
  }

  return vitals;
}

// ── INAMI Act Code Suggestion ─────────────────────────────────────────────────

const ACT_MAP: Array<{ keywords: string[]; code: string }> = [
  { keywords: ['toilette complète', 'bain complet'], code: '425110' },
  { keywords: ['toilette partielle', 'toilette', 'hygiène'], code: '425132' },
  { keywords: ['injection', 'insuline', 'sc', 'im', 'intram'], code: '425375' },
  { keywords: ['pansement complexe', 'plaie complexe', 'pansement profond'], code: '425611' },
  { keywords: ['pansement', 'plaie', 'wound', 'bourgeonnement'], code: '425596' },
  { keywords: ['pilulier', 'préparation médicament', 'préparation des médicaments'], code: '425434' },
  { keywords: ['administration médicament', 'administr', 'médicament donné'], code: '425456' },
  { keywords: ['surveillance paramètre', 'constantes', 'prise de paramètre'], code: '425670' },
  { keywords: ['consultation infirmière', 'évaluation'], code: '425692' },
];

function suggestActCodes(transcript: string): string[] {
  const t = transcript.toLowerCase();
  const codes = new Set<string>();

  for (const { keywords, code } of ACT_MAP) {
    if (keywords.some((kw) => t.includes(kw))) {
      codes.add(code);
    }
  }

  return [...codes];
}

// ── Clinical Alerts ───────────────────────────────────────────────────────────

function buildAlerts(vitals: ExtractedVitals, transcript: string): string[] {
  const alerts: string[] = [];
  const t = transcript.toLowerCase();

  if (vitals.glycemia !== undefined) {
    if (vitals.glycemia >= 300) {
      alerts.push(`⚠️ Glycémie critique: ${vitals.glycemia} mg/dL — contacter le médecin immédiatement`);
    } else if (vitals.glycemia > 200) {
      alerts.push(`Glycémie élevée: ${vitals.glycemia} mg/dL — surveiller`);
    } else if (vitals.glycemia < 70) {
      alerts.push(`⚠️ Hypoglycémie: ${vitals.glycemia} mg/dL — resucrer et surveiller`);
    }
  }

  if (vitals.oxygenSaturation !== undefined && vitals.oxygenSaturation < 92) {
    alerts.push(`⚠️ SpO₂ basse: ${vitals.oxygenSaturation}% — évaluer la détresse respiratoire`);
  }

  if (vitals.bloodPressureSystolic !== undefined) {
    if (vitals.bloodPressureSystolic >= 180) {
      alerts.push(`⚠️ Hypertension sévère: ${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic ?? '?'} mmHg`);
    } else if (vitals.bloodPressureSystolic < 90) {
      alerts.push(`⚠️ Hypotension: ${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic ?? '?'} mmHg`);
    }
  }

  if (vitals.temperature !== undefined && vitals.temperature >= 38.5) {
    alerts.push(`Fièvre: ${vitals.temperature}°C — noter évolution et informer le médecin`);
  }

  if (vitals.pain !== undefined && vitals.pain >= 7) {
    alerts.push(`Douleur intense (EVA ${vitals.pain}/10) — réévaluer le protocole antalgique`);
  }

  if (t.includes('chute') || t.includes('tombé') || t.includes('fallen')) {
    alerts.push('Chute signalée — évaluer le risque, compléter le rapport incident');
  }

  if (t.includes('confus') || t.includes('désori') || t.includes('agité')) {
    alerts.push('Confusion / désorientation signalée — informer le médecin traitant');
  }

  if (t.includes('dyspn') || t.includes('essouffl') || t.includes('manque de souffle')) {
    alerts.push('Dyspnée signalée — évaluer la fréquence respiratoire et SpO₂');
  }

  return alerts;
}

// ── Local SOAP Note Builder (NLP heuristics, no API) ─────────────────────────

function buildLocalSoapNote(transcript: string): SoapNote {
  const sentences = transcript.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);

  const subjective: string[] = [];
  const objective: string[] = [];
  const assessment: string[] = [];
  const plan: string[] = [];

  const subjectiveKw = ['douleur', 'fatigue', 'dyspn', 'plainte', 'signale', 'dit ', 'ressent', 'rapporte'];
  const planKw = ['prochain', 'prévu', 'rendez-vous', 'continuer', 'adapter', 'renouveler', 'surveiller', 'informer'];
  const assessmentKw = ['stable', 'amélior', 'aggrav', 'risque', 'bon aspect', 'normal', 'élevé', 'efficace', 'dans les normes'];

  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    if (subjectiveKw.some((k) => lower.includes(k))) {
      subjective.push(sentence);
    } else if (planKw.some((k) => lower.includes(k))) {
      plan.push(sentence);
    } else if (assessmentKw.some((k) => lower.includes(k))) {
      assessment.push(sentence);
    } else {
      objective.push(sentence);
    }
  }

  return {
    subjective: subjective.join(' ') || 'Patient coopératif. Pas de nouvelles plaintes rapportées.',
    objective: objective.join(' ') || transcript,
    assessment: assessment.join(' ') || 'Situation clinique stable au vu des éléments recueillis.',
    plan: plan.join(' ') || 'Continuer la prise en charge selon le protocole en cours.',
  };
}

// ── OpenAI SOAP Enhancement (optional) ───────────────────────────────────────

async function tryOpenAISoapNote(
  transcript: string,
  apiKey: string,
  context?: PatientContext,
): Promise<SoapNote | null> {
  try {
    const allergyLine = context?.allergies?.length
      ? `Allergies connues du patient : ${context.allergies.join(', ')}.`
      : '';

    const systemPrompt = [
      "Tu es un assistant pour infirmier(ère)s à domicile en Belgique.",
      "À partir de la note vocale dictée, génère une note SOAP structurée en français médical belge.",
      allergyLine,
      "Réponds UNIQUEMENT avec du JSON valide dans ce format exact :",
      '{"subjective":"...","objective":"...","assessment":"...","plan":"..."}',
      "Sois concis, précis, clinique. N'invente pas d'informations non mentionnées.",
    ].filter(Boolean).join('\n');

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Note vocale : "${transcript}"` },
        ],
        temperature: 0.2,
        max_tokens: 600,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) return null;

    const json = await res.json();
    const content: string = json.choices?.[0]?.message?.content ?? '';
    const parsed = JSON.parse(content) as Partial<SoapNote>;

    if (!parsed.subjective || !parsed.objective || !parsed.assessment || !parsed.plan) {
      return null;
    }

    return parsed as SoapNote;
  } catch {
    return null;
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const body = await req.json() as VoiceNoteRequest;
    const { transcript, patientContext } = body;

    if (!transcript?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Le champ transcript est requis.' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    // Step 1: Regex-based extraction — always runs, no API key needed.
    const extractedVitals = extractVitals(transcript);
    const suggestedActCodes = suggestActCodes(transcript);
    const clinicalAlerts = buildAlerts(extractedVitals, transcript);

    // Step 2: SOAP note — try OpenAI if key present, else local NLP.
    const openAiKey = Deno.env.get('OPENAI_API_KEY');
    const soapNote =
      (openAiKey ? await tryOpenAISoapNote(transcript, openAiKey, patientContext) : null) ??
      buildLocalSoapNote(transcript);

    const response: VoiceNoteResponse = {
      soapNote,
      extractedVitals,
      suggestedActCodes,
      clinicalAlerts,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }
});
