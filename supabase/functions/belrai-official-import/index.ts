/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  ingestBelraiOfficialResultRecord,
  type BelraiOfficialImportPayload,
} from './_shared/belraiOfficialIngest.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-belrai-webhook-secret',
} as const;

const STAFF_ROLES = new Set(['admin', 'coordinator', 'nurse']);

interface BelraiOfficialImportRequest extends BelraiOfficialImportPayload {
  patientId?: string;
  patientNiss?: string;
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
    },
  });
}

function readBearerToken(req: Request) {
  const header = req.headers.get('authorization');

  if (!header?.startsWith('Bearer ')) {
    return null;
  }

  const token = header.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

async function authenticateRequest(req: Request, adminClient: ReturnType<typeof createClient>) {
  const webhookSecret = Deno.env.get('BELRAI_WEBHOOK_SECRET');
  const providedWebhookSecret = req.headers.get('x-belrai-webhook-secret');

  if (webhookSecret && providedWebhookSecret === webhookSecret) {
    return {
      authMode: 'webhook' as const,
      actorId: null,
    };
  }

  const token = readBearerToken(req);

  if (!token) {
    throw new Response('Missing BelRAI webhook secret or bearer token.', { status: 401 });
  }

  const { data: userData, error: userError } = await adminClient.auth.getUser(token);

  if (userError || !userData.user) {
    throw new Response('Invalid bearer token.', { status: 401 });
  }

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  if (!profile || !STAFF_ROLES.has(profile.role)) {
    throw new Response('BelRAI imports are restricted to clinical staff.', { status: 403 });
  }

  return {
    authMode: 'jwt' as const,
    actorId: userData.user.id,
  };
}

async function resolvePatientDatabaseId(
  adminClient: ReturnType<typeof createClient>,
  body: BelraiOfficialImportRequest,
) {
  if (body.patientId) {
    const { data, error } = await adminClient
      .from('patients')
      .select('id')
      .eq('id', body.patientId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data?.id ?? null;
  }

  if (body.patientNiss) {
    const { data, error } = await adminClient
      .from('patients')
      .select('id')
      .eq('niss', body.patientNiss)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data?.id ?? null;
  }

  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(500, { error: 'Missing Supabase runtime secrets.' });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  try {
    const auth = await authenticateRequest(req, adminClient);
    const body = await req.json() as BelraiOfficialImportRequest;
    const patientId = await resolvePatientDatabaseId(adminClient, body);

    if (!patientId) {
      return jsonResponse(404, {
        error: 'Patient not found. Provide patientId or patientNiss linked to a patient record.',
      });
    }

    const importPayload: BelraiOfficialImportPayload = {
      assessmentScope: body.assessmentScope,
      caps: body.caps,
      externalAssessmentId: body.externalAssessmentId,
      officialPayload: body.officialPayload,
      receivedAt: body.receivedAt,
      scores: body.scores,
      sharedWithPatientAt: body.sharedWithPatientAt,
      sourceSystem: body.sourceSystem,
      summary: body.summary,
      templateKey: body.templateKey,
      templateVersion: body.templateVersion,
    };

    const result = await ingestBelraiOfficialResultRecord(adminClient, patientId, importPayload);

    return jsonResponse(200, {
      authMode: auth.authMode,
      actorId: auth.actorId,
      imported: true,
      patientId,
      ...result,
    });
  } catch (error) {
    if (error instanceof Response) {
      return jsonResponse(error.status, { error: await error.text() });
    }

    return jsonResponse(500, {
      error: error instanceof Error ? error.message : String(error),
    });
  }
});
