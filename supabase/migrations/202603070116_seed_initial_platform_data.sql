insert into public.patients (
  id,
  niss,
  first_name,
  last_name,
  date_of_birth,
  gender,
  phone,
  email,
  street,
  house_number,
  postal_code,
  city,
  lat,
  lng,
  mutuality,
  mutuality_number,
  katz_category,
  katz_score,
  prescribing_doctor,
  doctor_phone,
  is_active,
  last_visit_at,
  next_visit_at,
  created_at
)
values
  (
    '11111111-1111-1111-1111-111111111111',
    '85.07.15-123.45',
    'Marie',
    'Dubois',
    '1945-03-12',
    'F',
    '+32 471 23 45 67',
    null,
    'Rue des Tilleuls',
    '23',
    '1000',
    'Bruxelles',
    50.8467,
    4.3525,
    'Mutualité Chrétienne',
    '115-1234567-89',
    'B',
    28,
    'Dr. Van den Berg',
    '+32 2 123 45 67',
    true,
    '2026-03-05T09:00:00+01:00',
    '2026-03-06T10:30:00+01:00',
    '2024-06-15T00:00:00+00:00'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '50.03.22-567.89',
    'Pierre',
    'Janssen',
    '1950-03-22',
    'M',
    '+32 475 98 76 54',
    null,
    'Avenue Louise',
    '45',
    '1050',
    'Ixelles',
    50.8333,
    4.3667,
    'Solidaris',
    '206-9876543-21',
    'C',
    35,
    'Dr. Lejeune',
    null,
    true,
    '2026-03-05T08:00:00+01:00',
    '2026-03-06T08:00:00+01:00',
    '2023-11-20T00:00:00+00:00'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '38.11.05-234.56',
    'Jeanne',
    'Lambert',
    '1938-11-05',
    'F',
    '+32 473 11 22 33',
    null,
    'Chaussée de Waterloo',
    '112',
    '1060',
    'Saint-Gilles',
    50.8283,
    4.3475,
    'Mutualité Libre',
    '319-4567890-12',
    'Cd',
    42,
    'Dr. Peeters',
    null,
    true,
    '2026-03-05T09:15:00+01:00',
    '2026-03-06T09:15:00+01:00',
    '2024-01-10T00:00:00+00:00'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '60.08.30-789.01',
    'André',
    'Willems',
    '1960-08-30',
    'M',
    '+32 476 55 66 77',
    null,
    'Rue Haute',
    '8',
    '1000',
    'Bruxelles',
    50.8399,
    4.3488,
    'Partenamut',
    '407-1112233-44',
    'A',
    18,
    'Dr. Dupont',
    null,
    true,
    '2026-03-04T11:00:00+01:00',
    '2026-03-06T11:00:00+01:00',
    '2025-09-01T00:00:00+00:00'
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    '72.05.18-345.67',
    'Claudine',
    'Martin',
    '1972-05-18',
    'F',
    '+32 479 88 99 00',
    null,
    'Boulevard Anspach',
    '56',
    '1000',
    'Bruxelles',
    50.8505,
    4.3488,
    'Mutualité Chrétienne',
    '115-5566778-90',
    'O',
    null,
    'Dr. Renard',
    null,
    true,
    '2026-03-03T08:30:00+01:00',
    '2026-03-07T08:30:00+01:00',
    '2025-12-01T00:00:00+00:00'
  )
on conflict (id) do update
set
  niss = excluded.niss,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  date_of_birth = excluded.date_of_birth,
  gender = excluded.gender,
  phone = excluded.phone,
  email = excluded.email,
  street = excluded.street,
  house_number = excluded.house_number,
  postal_code = excluded.postal_code,
  city = excluded.city,
  lat = excluded.lat,
  lng = excluded.lng,
  mutuality = excluded.mutuality,
  mutuality_number = excluded.mutuality_number,
  katz_category = excluded.katz_category,
  katz_score = excluded.katz_score,
  prescribing_doctor = excluded.prescribing_doctor,
  doctor_phone = excluded.doctor_phone,
  is_active = excluded.is_active,
  last_visit_at = excluded.last_visit_at,
  next_visit_at = excluded.next_visit_at,
  created_at = excluded.created_at,
  updated_at = timezone('utc', now());

insert into public.patient_allergies (patient_id, label)
values
  ('11111111-1111-1111-1111-111111111111', 'Pénicilline'),
  ('11111111-1111-1111-1111-111111111111', 'Latex'),
  ('33333333-3333-3333-3333-333333333333', 'Aspirine'),
  ('55555555-5555-5555-5555-555555555555', 'Iode')
on conflict do nothing;

insert into public.patient_pathologies (patient_id, label)
values
  ('11111111-1111-1111-1111-111111111111', 'Diabète type 2'),
  ('11111111-1111-1111-1111-111111111111', 'Hypertension'),
  ('11111111-1111-1111-1111-111111111111', 'Ulcère veineux jambe gauche'),
  ('22222222-2222-2222-2222-222222222222', 'Diabète type 1'),
  ('22222222-2222-2222-2222-222222222222', 'Insuffisance cardiaque'),
  ('22222222-2222-2222-2222-222222222222', 'AVC séquellaire'),
  ('33333333-3333-3333-3333-333333333333', 'Démence modérée'),
  ('33333333-3333-3333-3333-333333333333', 'Ostéoporose'),
  ('33333333-3333-3333-3333-333333333333', 'Plaie sacrum stade III'),
  ('44444444-4444-4444-4444-444444444444', 'BPCO'),
  ('44444444-4444-4444-4444-444444444444', 'Post-op prothèse hanche'),
  ('55555555-5555-5555-5555-555555555555', 'Diabète gestationnel (historique)'),
  ('55555555-5555-5555-5555-555555555555', 'Injection insuline')
on conflict do nothing;

insert into public.patient_consents (
  patient_id,
  consent_status,
  therapeutic_link_status,
  exclusion_note,
  last_sync_at
)
values
  ('11111111-1111-1111-1111-111111111111', 'active', 'ok', 'Aucune', '2026-03-06T09:14:00+01:00'),
  ('44444444-4444-4444-4444-444444444444', 'active', 'review', 'Médecin remplaçant exclu', '2026-03-06T08:47:00+01:00'),
  ('33333333-3333-3333-3333-333333333333', 'renewal', 'ok', 'Aucune', '2026-03-05T16:20:00+01:00'),
  ('55555555-5555-5555-5555-555555555555', 'missing', 'blocked', 'Opposition documents partagés', '2026-03-05T11:05:00+01:00')
on conflict (patient_id) do update
set
  consent_status = excluded.consent_status,
  therapeutic_link_status = excluded.therapeutic_link_status,
  exclusion_note = excluded.exclusion_note,
  last_sync_at = excluded.last_sync_at,
  updated_at = timezone('utc', now());

insert into public.patient_dashboard_state (
  patient_id,
  nurse_name,
  eta_minutes,
  eta_status,
  visits_today,
  health_tip
)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'Marie Laurent',
    12,
    'en_route',
    3,
    'Votre tension est légèrement élevée ces derniers jours. Pensez à réduire le sel et à marcher 15 minutes après le repas.'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Marie Laurent',
    24,
    'preparing',
    2,
    'Gardez vos bandelettes de glycémie à portée de main pour votre prochaine visite.'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Sophie Dupuis',
    18,
    'preparing',
    2,
    'Hydratez-vous régulièrement et gardez votre téléphone chargé près de vous.'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'Laura Van Damme',
    9,
    'en_route',
    1,
    'Préparez votre ordonnance et votre carnet de suivi avant la prochaine visite.'
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'Thomas Maes',
    31,
    'preparing',
    1,
    'Pensez à prendre une collation avant votre injection du soir si votre infirmière vous l’a recommandé.'
  )
on conflict (patient_id) do update
set
  nurse_name = excluded.nurse_name,
  eta_minutes = excluded.eta_minutes,
  eta_status = excluded.eta_status,
  visits_today = excluded.visits_today,
  health_tip = excluded.health_tip,
  updated_at = timezone('utc', now());

insert into public.medication_reminders (
  patient_id,
  name,
  scheduled_for,
  status,
  taken_at,
  display_order
)
values
  ('11111111-1111-1111-1111-111111111111', 'Metformine 850mg', '08:00', 'due', null, 1),
  ('11111111-1111-1111-1111-111111111111', 'Lisinopril 10mg', '08:00', 'taken', '2026-03-06T08:05:00+01:00', 2),
  ('11111111-1111-1111-1111-111111111111', 'Insuline Lantus 18UI', '21:00', 'upcoming', null, 3)
on conflict do nothing;

insert into public.patient_timeline_events (
  patient_id,
  event_time,
  label,
  status,
  display_order
)
values
  ('11111111-1111-1111-1111-111111111111', '07:00', 'Glycémie à jeun', 'done', 1),
  ('11111111-1111-1111-1111-111111111111', '08:00', 'Médicaments matin', 'done', 2),
  ('11111111-1111-1111-1111-111111111111', '10:30', 'Visite infirmière — Toilette + Plaie', 'current', 3),
  ('11111111-1111-1111-1111-111111111111', '12:00', 'Médicaments midi', 'upcoming', 4),
  ('11111111-1111-1111-1111-111111111111', '21:00', 'Insuline + Médicaments soir', 'upcoming', 5)
on conflict do nothing;

insert into public.patient_vital_snapshots (
  patient_id,
  label,
  value,
  unit,
  tone,
  display_order,
  recorded_at
)
values
  ('11111111-1111-1111-1111-111111111111', 'Tension', '145/85', 'mmHg', 'red', 1, '2026-03-06T08:55:00+01:00'),
  ('11111111-1111-1111-1111-111111111111', 'Glycémie', '142', 'mg/dL', 'amber', 2, '2026-03-06T08:55:00+01:00'),
  ('11111111-1111-1111-1111-111111111111', 'SpO₂', '97', '%', 'green', 3, '2026-03-06T08:55:00+01:00'),
  ('11111111-1111-1111-1111-111111111111', 'Poids', '72', 'kg', 'blue', 4, '2026-03-06T08:55:00+01:00')
on conflict (patient_id, label) do update
set
  value = excluded.value,
  unit = excluded.unit,
  tone = excluded.tone,
  display_order = excluded.display_order,
  recorded_at = excluded.recorded_at,
  updated_at = timezone('utc', now());

insert into public.visits (
  id,
  patient_id,
  nurse_id,
  scheduled_start,
  scheduled_end,
  status,
  notes,
  signature,
  completed_at
)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  null,
  '2026-03-06T10:30:00+01:00',
  '2026-03-06T11:05:00+01:00',
  'completed',
  'Toilette complète, vérification pansement et paramètres vitaux.',
  'signature-demo',
  '2026-03-06T11:05:00+01:00'
)
on conflict (id) do update
set
  patient_id = excluded.patient_id,
  nurse_id = excluded.nurse_id,
  scheduled_start = excluded.scheduled_start,
  scheduled_end = excluded.scheduled_end,
  status = excluded.status,
  notes = excluded.notes,
  signature = excluded.signature,
  completed_at = excluded.completed_at,
  updated_at = timezone('utc', now());

insert into public.visit_acts (visit_id, code, label, value_w, category)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '425132', 'Toilette complète', 1.00, 'toilette'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '423355', 'Soin de plaie simple', 1.20, 'wound')
on conflict do nothing;

insert into public.visit_vitals (
  visit_id,
  blood_pressure_systolic,
  blood_pressure_diastolic,
  heart_rate,
  temperature,
  oxygen_saturation,
  glycemia,
  weight,
  pain
)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  145,
  85,
  79,
  36.8,
  97,
  142,
  72,
  2
)
on conflict (visit_id) do update
set
  blood_pressure_systolic = excluded.blood_pressure_systolic,
  blood_pressure_diastolic = excluded.blood_pressure_diastolic,
  heart_rate = excluded.heart_rate,
  temperature = excluded.temperature,
  oxygen_saturation = excluded.oxygen_saturation,
  glycemia = excluded.glycemia,
  weight = excluded.weight,
  pain = excluded.pain,
  updated_at = timezone('utc', now());

insert into public.dashboard_sections (scope, section_key, payload)
values
  (
    'admin',
    'summary',
    $${
      "userCount": 42,
      "alertCount": 8,
      "certificateDeadlines": 2,
      "uptime": 99.9,
      "complianceScore": 71,
      "mfaCoverage": 91,
      "backupReadiness": 92,
      "pendingDsars": 2,
      "activeIncidentCount": 2
    }$$::jsonb
  ),
  (
    'admin',
    'contact',
    $${
      "name": "Claire DPO",
      "role": "Admin · DPO contact",
      "status": "En ligne"
    }$$::jsonb
  ),
  (
    'admin',
    'certificateBanner',
    $${
      "title": "Attention certificats",
      "detail": "Le certificat MyCareNet production expire le 25 mars 2026. Le runbook de renouvellement est prêt."
    }$$::jsonb
  ),
  (
    'admin',
    'serviceHealth',
    $$[
      { "name": "MyCareNet", "status": "ok", "uptime": "99.94%", "latency": "118ms" },
      { "name": "eHealthBox", "status": "ok", "uptime": "99.88%", "latency": "93ms" },
      { "name": "MetaHub / Consent", "status": "warning", "uptime": "98.72%", "latency": "284ms" },
      { "name": "Supabase", "status": "ok", "uptime": "99.99%", "latency": "21ms" }
    ]$$::jsonb
  ),
  (
    'admin',
    'riskQueues',
    $$[
      { "title": "Certificats à renouveler", "count": 2, "severity": "amber", "detail": "1 certificat prod expire sous 18 jours" },
      { "title": "Sessions risquées", "count": 3, "severity": "red", "detail": "Connexions admin depuis nouveaux appareils" },
      { "title": "DSAR ouvertes", "count": 2, "severity": "blue", "detail": "2 demandes arrivent à échéance cette semaine" },
      { "title": "Incidents à qualifier", "count": 2, "severity": "amber", "detail": "Pré-audit de fuite de document à confirmer" }
    ]$$::jsonb
  ),
  (
    'admin',
    'recentActivity',
    $$[
      { "user": "Claire DPO", "role": "Admin", "action": "Clôture DSAR #DS-104", "time": "il y a 11 min" },
      { "user": "Admin System", "role": "Système", "action": "Restauration de test validée", "time": "il y a 42 min" },
      { "user": "Luc Ops", "role": "Ops", "action": "Rotation certificat eHealth test", "time": "il y a 1 h" },
      { "user": "Marie Billing", "role": "Billing", "action": "Relance blocage rejet Solidaris", "time": "il y a 2 h" }
    ]$$::jsonb
  ),
  (
    'admin',
    'recoveryHighlights',
    $$[
      { "label": "Dernier snapshot", "value": "06/03 02:30", "tone": "green" },
      { "label": "Restore drill", "value": "Validé le 02/03", "tone": "blue" },
      { "label": "Chiffrement backups", "value": "AES-256", "tone": "green" },
      { "label": "RTO cible", "value": "45 min", "tone": "amber" }
    ]$$::jsonb
  ),
  (
    'admin',
    'audit',
    $${
      "auditLog": [
        { "id": "1", "time": "09:15", "date": "06/03/2026", "user": "Marie Laurent", "action": "VIEW", "resource": "Dossier Dubois Marie", "ip": "192.168.1.42", "severity": "medium", "pii": true, "system": false },
        { "id": "2", "time": "09:12", "date": "06/03/2026", "user": "Marie Laurent", "action": "EDIT", "resource": "Visite #2847 — Paramètres vitaux", "ip": "192.168.1.42", "severity": "medium", "pii": true, "system": false },
        { "id": "3", "time": "09:10", "date": "06/03/2026", "user": "Système", "action": "EXPORT", "resource": "Lot eFact Mars-001 (12 factures)", "ip": "srv-01", "severity": "high", "pii": false, "system": true },
        { "id": "4", "time": "09:05", "date": "06/03/2026", "user": "Sophie Dupuis", "action": "VIEW", "resource": "Dossier Willems André", "ip": "192.168.1.38", "severity": "low", "pii": true, "system": false },
        { "id": "5", "time": "08:45", "date": "06/03/2026", "user": "Admin System", "action": "LOGIN", "resource": "Connexion admin", "ip": "10.0.0.1", "severity": "medium", "pii": false, "system": true },
        { "id": "6", "time": "08:30", "date": "06/03/2026", "user": "Marc Dumont", "action": "EDIT", "resource": "Correction rejet #R003", "ip": "192.168.1.55", "severity": "low", "pii": false, "system": false },
        { "id": "7", "time": "08:15", "date": "06/03/2026", "user": "Marie Laurent", "action": "LOGIN", "resource": "Connexion mobile NFC", "ip": "4G-mobile", "severity": "high", "pii": false, "system": false },
        { "id": "8", "time": "03:00", "date": "06/03/2026", "user": "Système", "action": "BACKUP", "resource": "Backup automatique DB (24.3 MB)", "ip": "srv-01", "severity": "low", "pii": false, "system": true }
      ],
      "suspiciousActivityNote": "Une connexion mobile NFC hors profil réseau et un export système massif ont été classés en revue prioritaire."
    }$$::jsonb
  ),
  (
    'admin',
    'rgpd',
    $${
      "complianceChecks": [
        { "id": "c1", "label": "Consentement patients", "description": "Couverture consentements actifs et exclusions suivies", "status": "ok", "lastCheck": "06/03/2026" },
        { "id": "c2", "label": "Chiffrement données", "description": "AES-256 au repos, TLS 1.3 en transit", "status": "ok", "lastCheck": "06/03/2026" },
        { "id": "c3", "label": "Politique de rétention", "description": "Politique métier active avec propriétaires désignés", "status": "ok", "lastCheck": "01/03/2026" },
        { "id": "c4", "label": "Registre des traitements", "description": "Article 30 RGPD — 92% des activités à jour", "status": "warning", "lastCheck": "01/03/2026" },
        { "id": "c5", "label": "DPO désigné", "description": "Délégué à la protection des données actif", "status": "ok", "lastCheck": "15/02/2026" },
        { "id": "c6", "label": "AIPD réalisée", "description": "Analyse d’impact data en revue annuelle", "status": "warning", "lastCheck": "15/01/2026" },
        { "id": "c7", "label": "Formation personnel", "description": "Sensibilisation RGPD annuelle", "status": "warning", "lastCheck": "10/12/2025" }
      ],
      "requests": [
        { "id": "r1", "type": "access", "patient": "Dubois Marie", "date": "05/03/2026", "deadline": "04/04/2026", "status": "completed" },
        { "id": "r2", "type": "rectification", "patient": "Janssen Pierre", "date": "02/03/2026", "deadline": "01/04/2026", "status": "completed" },
        { "id": "r3", "type": "portability", "patient": "Lambert Jeanne", "date": "28/02/2026", "deadline": "30/03/2026", "status": "pending" },
        { "id": "r4", "type": "access", "patient": "Martin Claudine", "date": "06/03/2026", "deadline": "05/04/2026", "status": "pending" }
      ],
      "registerCompletion": 92,
      "requestsHandled": 3,
      "dpiaToReview": 1,
      "nextTrainingInDays": 14,
      "slaNotice": "La demande de portabilité de Jeanne Lambert arrive à échéance le 30 mars 2026.",
      "governanceHighlights": [
        { "title": "Case DPO active", "detail": "Mise à jour du registre sous-processors et revue AIPD prévue cette semaine.", "tone": "blue" },
        { "title": "Rétention", "detail": "85% des politiques ont un propriétaire et un point de revue. 2 politiques restent sans validation métier.", "tone": "green" },
        { "title": "Pré-incident", "detail": "Aucun incident confirmé. Un partage document hors canal est en revue avec le DPO.", "tone": "amber" }
      ]
    }$$::jsonb
  ),
  (
    'admin',
    'security',
    $${
      "privilegedAccounts": [
        { "name": "Claire DPO", "scope": "Admin global + RGPD", "lastElevation": "06/03 • 08:42", "mfa": "strong", "risk": "low" },
        { "name": "Marc Dumont", "scope": "Billing operations", "lastElevation": "05/03 • 17:10", "mfa": "strong", "risk": "low" },
        { "name": "Sophie Dupuis", "scope": "Support & provisioning", "lastElevation": "06/03 • 07:58", "mfa": "review", "risk": "medium" },
        { "name": "Compte break-glass", "scope": "Secours prod", "lastElevation": "01/02 • 02:14", "mfa": "vault", "risk": "high" }
      ],
      "riskySessions": [
        { "user": "Sophie Dupuis", "context": "Nouvel appareil Windows · Bruxelles", "signal": "Appareil non approuvé", "score": "72/100", "severity": "medium" },
        { "user": "Marie Laurent", "context": "Connexion mobile 4G", "signal": "Habitude réseau atypique", "score": "84/100", "severity": "high" },
        { "user": "Admin API", "context": "Jeton de service", "signal": "Rotation > 80 jours", "score": "67/100", "severity": "medium" }
      ],
      "trustedDevices": [
        { "label": "MacBook DPO", "owner": "Claire DPO", "state": "trusted", "lastSeen": "Aujourd’hui 09:00" },
        { "label": "Surface Billing-02", "owner": "Marc Dumont", "state": "trusted", "lastSeen": "Aujourd’hui 08:31" },
        { "label": "Win11 Support-Temp", "owner": "Sophie Dupuis", "state": "review", "lastSeen": "Aujourd’hui 07:58" },
        { "label": "Android BYOD", "owner": "Prestataire externe", "state": "blocked", "lastSeen": "05/03 18:12" }
      ],
      "authMix": [
        { "method": "MFA app", "adoption": "68%", "posture": "Cible principale" },
        { "method": "WebAuthn / clé", "adoption": "21%", "posture": "Accès privilégiés" },
        { "method": "SMS fallback", "adoption": "7%", "posture": "À réduire" },
        { "method": "Token service", "adoption": "4%", "posture": "Rotation renforcée" }
      ],
      "breakGlassNotice": "Le compte de secours n’a pas été re-certifié depuis plus de 30 jours. Rotation du secret et test de récupération à planifier."
    }$$::jsonb
  ),
  (
    'admin',
    'certificates',
    $${
      "inventory": [
        { "name": "eHealth Production", "environment": "Prod", "expires": "25/03/2026", "owner": "Platform Ops", "usage": "MyCareNet + eFact", "status": "expiring" },
        { "name": "MyCareNet Test", "environment": "Test", "expires": "18/12/2026", "owner": "QA Platform", "usage": "Sandbox homologation", "status": "ok" },
        { "name": "eHealthBox Gateway", "environment": "Prod", "expires": "09/05/2026", "owner": "Messaging", "usage": "Secure provider messaging", "status": "warning" },
        { "name": "Signing certificate", "environment": "Prod", "expires": "14/01/2027", "owner": "Security", "usage": "Exports & reports", "status": "ok" }
      ],
      "trustChecks": [
        { "label": "OCSP / CRL", "state": "ok", "detail": "Pas de révocation détectée" },
        { "label": "Chaîne racine eHealth", "state": "ok", "detail": "Chaîne complète validée" },
        { "label": "Alias HSM / store", "state": "warning", "detail": "Rotation alias prévue ce mois-ci" },
        { "label": "Secrets CI/CD", "state": "ok", "detail": "Dernière rotation il y a 23 jours" }
      ],
      "approvals": [
        { "surface": "MyCareNet production", "status": "approved", "detail": "Homologation validée le 12/01/2026" },
        { "surface": "eFact production", "status": "approved", "detail": "Flux acceptés sans rejet critique" },
        { "surface": "Hourly pilot sandbox", "status": "review", "detail": "Comparatif métier en cours" },
        { "surface": "eHealthBox secure relay", "status": "approved", "detail": "Canal opérationnel et supervisé" }
      ],
      "renewalNotice": "Le certificat eHealth production expire le 25 mars 2026. Préparation du CSR, validation du trust chain et test sandbox recommandés avant dépôt."
    }$$::jsonb
  ),
  (
    'admin',
    'dataGovernance',
    $${
      "processingRegister": [
        { "activity": "Dossier patient & soins", "lawfulBasis": "Mission de soins", "owner": "Direction clinique", "completeness": "100%", "status": "ok" },
        { "activity": "Facturation & MyCareNet", "lawfulBasis": "Obligation légale", "owner": "Bureau tarification", "completeness": "96%", "status": "ok" },
        { "activity": "Analytics qualité", "lawfulBasis": "Intérêt légitime", "owner": "Qualité", "completeness": "78%", "status": "warning" },
        { "activity": "Pilote horaire", "lawfulBasis": "Intérêt public / convention", "owner": "Programme pilote", "completeness": "72%", "status": "warning" }
      ],
      "dsarQueue": [
        { "id": "r1", "type": "access", "patient": "Dubois Marie", "date": "05/03/2026", "deadline": "04/04/2026", "status": "completed" },
        { "id": "r2", "type": "rectification", "patient": "Janssen Pierre", "date": "02/03/2026", "deadline": "01/04/2026", "status": "completed" },
        { "id": "r3", "type": "portability", "patient": "Lambert Jeanne", "date": "28/02/2026", "deadline": "30/03/2026", "status": "pending" },
        { "id": "r4", "type": "access", "patient": "Martin Claudine", "date": "06/03/2026", "deadline": "05/04/2026", "status": "pending" }
      ],
      "processors": [
        { "name": "Supabase hosting", "region": "EU", "dpa": "Signé", "scope": "Base données & storage" },
        { "name": "SMS fallback provider", "region": "EU", "dpa": "À revoir", "scope": "OTP secours" },
        { "name": "Email transactional", "region": "EU", "dpa": "Signé", "scope": "Notifications non sensibles" },
        { "name": "CI/CD secrets vault", "region": "EU", "dpa": "Signé", "scope": "Secrets plateforme" }
      ],
      "retentionControls": [
        { "label": "Politiques avec owner", "value": "85%", "tone": "green" },
        { "label": "Jeux de données sans revue", "value": "2", "tone": "amber" },
        { "label": "Exports temporaires > 7 jours", "value": "1", "tone": "red" }
      ],
      "article30Notice": "Le registre “Pilote horaire” reste incomplet sur les catégories de destinataires et la durée de conservation."
    }$$::jsonb
  ),
  (
    'admin',
    'consents',
    $${
      "patientConsents": [
        { "patient": "Dubois Marie", "consent": "active", "therapeuticLink": "ok", "exclusion": "Aucune", "lastSync": "09:14" },
        { "patient": "Willems André", "consent": "active", "therapeuticLink": "review", "exclusion": "Médecin remplaçant exclu", "lastSync": "08:47" },
        { "patient": "Lambert Jeanne", "consent": "renewal", "therapeuticLink": "ok", "exclusion": "Aucune", "lastSync": "Hier 16:20" },
        { "patient": "Martin Claudine", "consent": "missing", "therapeuticLink": "blocked", "exclusion": "Opposition documents partagés", "lastSync": "Hier 11:05" }
      ],
      "syncGaps": [
        { "label": "2 consentements non re-synchronisés", "detail": "Après modification proxy/famille", "severity": "amber" },
        { "label": "1 lien thérapeutique expiré", "detail": "Intervenant externe non renouvelé", "severity": "red" },
        { "label": "0 conflit de source", "detail": "eHealth ↔ application cohérents", "severity": "green" }
      ],
      "accessAudit": [
        { "label": "Accès couverts par consentement", "value": "184", "tone": "green" },
        { "label": "Accès sous exclusion active", "value": "3", "tone": "amber" },
        { "label": "Accès bloqués automatiquement", "value": "5", "tone": "blue" }
      ],
      "syncNotice": "Deux mises à jour de consentement patient n’ont pas encore reçu de confirmation bidirectionnelle. Les accès dépendent du cache applicatif actuel."
    }$$::jsonb
  ),
  (
    'admin',
    'incidents',
    $${
      "active": [
        { "title": "Document partagé hors canal", "severity": "medium", "opened": "06/03/2026 • 14:10", "owner": "Claire DPO", "deadline": "48h restantes", "apd": false, "status": "investigation" },
        { "title": "Jeton de service non roté", "severity": "high", "opened": "06/03/2026 • 09:20", "owner": "Platform Ops", "deadline": "61h restantes", "apd": true, "status": "containment" }
      ],
      "workflow": [
        { "step": "Qualification", "detail": "Confirmer données concernées, catégories et volumétrie", "state": "done" },
        { "step": "Containment", "detail": "Révoquer jetons, bloquer partage, préserver les preuves", "state": "active" },
        { "step": "Notification DPO", "detail": "Traçabilité interne et décision de notification", "state": "active" },
        { "step": "APD / patients", "detail": "Préparer notification si risque élevé confirmé", "state": "pending" }
      ],
      "exercises": [
        { "name": "Table-top exfiltration", "date": "20/02/2026", "result": "42 min pour confinement", "status": "ok" },
        { "name": "Ransomware sur laptop support", "date": "12/01/2026", "result": "Restore validé sans perte", "status": "ok" },
        { "name": "Erreur d’envoi eHealthBox", "date": "18/12/2025", "result": "Notification patient à documenter", "status": "warning" }
      ],
      "documentation": [
        { "title": "Journal de décision", "detail": "Chronologie, catégories de données, personnes exposées, justification de notification ou non-notification.", "tone": "blue" },
        { "title": "Notifications externes", "detail": "Brouillons APD, communication patient, et coordination avec partenaires eHealth si impact interop.", "tone": "amber" }
      ],
      "governanceNotice": "Le cas “Jeton de service non roté” nécessite une décision documentée DPO sur la notification APD avant le 9 mars 2026."
    }$$::jsonb
  ),
  (
    'admin',
    'backup',
    $${
      "snapshots": [
        { "workload": "Base patients", "lastSnapshot": "06/03 • 03:00", "retention": "35 jours", "status": "ok" },
        { "workload": "Documents cliniques", "lastSnapshot": "06/03 • 03:05", "retention": "90 jours", "status": "ok" },
        { "workload": "Billing & eFact", "lastSnapshot": "06/03 • 03:11", "retention": "60 jours", "status": "ok" },
        { "workload": "Audit logs", "lastSnapshot": "06/03 • 03:15", "retention": "365 jours", "status": "ok" },
        { "workload": "Analytics lake", "lastSnapshot": "05/03 • 23:40", "retention": "14 jours", "status": "warning" }
      ],
      "recoveryObjectives": [
        { "system": "Core EHR", "rpo": "15 min", "rto": "1 h", "readiness": "ok" },
        { "system": "MyCareNet connectors", "rpo": "30 min", "rto": "2 h", "readiness": "ok" },
        { "system": "Reporting warehouse", "rpo": "4 h", "rto": "6 h", "readiness": "review" }
      ],
      "restoreDrills": [
        { "scenario": "Perte base patients", "date": "20/02/2026", "result": "Restore en 42 min", "status": "ok" },
        { "scenario": "Corruption stockage documents", "date": "14/01/2026", "result": "RTO tenu, checksum OK", "status": "ok" },
        { "scenario": "Site secondaire indisponible", "date": "09/12/2025", "result": "2 dépendances à automatiser", "status": "warning" }
      ],
      "preparedness": [
        { "title": "Runbooks critiques versionnés", "detail": "Base patients, documents cliniques et connecteurs MyCareNet disposent d’un guide de reprise documenté.", "tone": "green" },
        { "title": "Exercice multi-sites planifié", "detail": "Simulation failover secondaire prévue le 28 mars 2026 avec validation métier du bureau de facturation.", "tone": "blue" }
      ],
      "lagNotice": "Le dernier snapshot analytics a 3h20 de retard. Aucun impact clinique direct, mais la conformité des exports doit être surveillée."
    }$$::jsonb
  ),
  (
    'admin',
    'settings',
    $${
      "connectors": [
        { "name": "MyCareNet production", "state": "active", "detail": "Flux prod activés et supervisés" },
        { "name": "Hourly pilot sandbox", "state": "sandbox", "detail": "Comparatif activé pour les équipes pilotes" },
        { "name": "eHealthBox secure relay", "state": "active", "detail": "Messagerie sécurisée en service" },
        { "name": "SMS fallback", "state": "review", "detail": "Usage limité aux OTP de secours" }
      ],
      "maintenanceWindows": [
        { "title": "Maintenance mars", "schedule": "28/03/2026 • 22:00-23:30", "impact": "Connecteurs externes + sync mobile" },
        { "title": "Release compliance", "schedule": "11/04/2026 • 21:00-22:00", "impact": "Pages admin et exports RGPD" }
      ],
      "settingsHighlights": [
        { "title": "Pack visuel Meta Cares", "detail": "Theme clinique, labels FR/NL, et surfaces gradient alignés sur l’expérience cross-role.", "tone": "blue" },
        { "title": "Escalades critiques", "detail": "Alertes envoyées aux admins, DPO et coordinateurs selon la criticité des événements de conformité.", "tone": "green" },
        { "title": "Mode durci", "detail": "Verrouille les expériences expérimentales et force la revue sécurité avant exposition à l’équipe.", "tone": "amber" }
      ],
      "statusCards": [
        { "label": "Ops", "detail": "Stable", "tone": "green" },
        { "label": "Flags", "detail": "18 actifs", "tone": "blue" },
        { "label": "Pilotes", "detail": "2 cohortes", "tone": "amber" },
        { "label": "Alertes", "detail": "Escalade auto", "tone": "red" }
      ],
      "featureFlagsCount": 18,
      "toggleDefaults": {
        "autoFreeze": true,
        "maintenanceBanner": true,
        "betaFlags": false
      }
    }$$::jsonb
  ),
  (
    'coordinator',
    'teamMembers',
    $$[
      { "name": "Marie Laurent", "visits": 12, "completed": 7, "revenue": 842, "status": "active", "currentPatient": "Dubois M.", "zone": "Ixelles" },
      { "name": "Sophie Dupuis", "visits": 10, "completed": 5, "revenue": 612, "status": "active", "currentPatient": "Lambert J.", "zone": "Uccle" },
      { "name": "Thomas Maes", "visits": 8, "completed": 8, "revenue": 520, "status": "done", "zone": "Etterbeek" },
      { "name": "Laura Van Damme", "visits": 9, "completed": 3, "revenue": 310, "status": "active", "currentPatient": "Willems A.", "zone": "Watermael" },
      { "name": "Kevin Peeters", "visits": 0, "completed": 0, "revenue": 0, "status": "off", "zone": "Auderghem" }
    ]$$::jsonb
  ),
  (
    'coordinator',
    'alerts',
    $$[
      { "id": "a1", "message": "Glycémie élevée — Janssen P. (312 mg/dL)", "nurse": "Marie Laurent", "time": "08:45", "type": "vital" },
      { "id": "a2", "message": "3 rejets eFact lot du 04/03", "nurse": "Sophie Dupuis", "time": "09:30", "type": "billing" },
      { "id": "a3", "message": "Retard >15min — Visite Willems A.", "nurse": "Laura Van Damme", "time": "10:15", "type": "delay" }
    ]$$::jsonb
  ),
  (
    'coordinator',
    'activityFeed',
    $$[
      { "id": "f1", "nurse": "Marie Laurent", "action": "Visite terminée", "patient": "Dubois M.", "time": "10:32", "icon": "check", "color": "text-mc-green-500" },
      { "id": "f2", "nurse": "Laura Van Damme", "action": "Visite démarrée", "patient": "Willems A.", "time": "10:15", "icon": "activity", "color": "text-mc-blue-500" },
      { "id": "f3", "nurse": "Sophie Dupuis", "action": "Lot eFact envoyé", "patient": "14 factures", "time": "09:50", "icon": "send", "color": "text-mc-green-500" },
      { "id": "f4", "nurse": "Thomas Maes", "action": "Tournée terminée", "patient": "8/8 visites", "time": "09:30", "icon": "check", "color": "text-mc-green-500" },
      { "id": "f5", "nurse": "Marie Laurent", "action": "Alerte glycémie", "patient": "Janssen P.", "time": "08:45", "icon": "alert", "color": "text-mc-red-500" }
    ]$$::jsonb
  ),
  (
    'coordinator',
    'aiInsights',
    $$[
      { "text": "Charge +15% prévue jeudi — planifier renfort zone Ixelles", "priority": "high" },
      { "text": "Sophie Dupuis: 3 visites annulées cette semaine — vérifier planning", "priority": "medium" },
      { "text": "Taux acceptation eFact en hausse: 98.7% (+1.2%)", "priority": "low" }
    ]$$::jsonb
  ),
  (
    'billing',
    'kpis',
    $${
      "dailyInvoices": 42,
      "pendingAmount": 3248.5,
      "acceptanceRate": 97.3,
      "rejections": 5,
      "avgProcessingMin": 2.4,
      "monthlyRevenue": 48750,
      "prevMonthRevenue": 45200
    }$$::jsonb
  ),
  (
    'billing',
    'revenueTrend',
    $$[
      { "month": "Oct", "value": 38200 },
      { "month": "Nov", "value": 41500 },
      { "month": "Déc", "value": 39800 },
      { "month": "Jan", "value": 45200 },
      { "month": "Fév", "value": 45200 },
      { "month": "Mars", "value": 48750 }
    ]$$::jsonb
  ),
  (
    'billing',
    'recentActivity',
    $$[
      { "id": "1", "action": "Lot EF-2026-03-0445 envoyé", "detail": "12 factures • €867.40", "time": "Il y a 5 min", "icon": "send", "color": "text-mc-blue-500" },
      { "id": "2", "action": "Rejet corrigé — Martin Claudine", "detail": "Cumul 425110+425132 → 425132 seul", "time": "Il y a 18 min", "icon": "check", "color": "text-mc-green-500" },
      { "id": "3", "action": "Nouveau rejet — Peeters Henri", "detail": "Prescription manquante — 425375", "time": "Il y a 32 min", "icon": "alert", "color": "text-mc-red-500" },
      { "id": "4", "action": "Paiement reçu MC 200", "detail": "€2,340.00 — Lot Fév. sem.4", "time": "Il y a 1h", "icon": "euro", "color": "text-mc-green-500" },
      { "id": "5", "action": "Accord approuvé — Janssens Maria", "detail": "Forfait B renouvelé 12 mois", "time": "Il y a 2h", "icon": "check", "color": "text-mc-green-500" }
    ]$$::jsonb
  ),
  (
    'billing',
    'mutuelleStatus',
    $$[
      { "name": "MC 100 (Alliance nationale)", "status": "online" },
      { "name": "MC 200 (Mutualité chrétienne)", "status": "online" },
      { "name": "MC 300 (Mutualité neutre)", "status": "online" },
      { "name": "MC 500 (Mutualité libérale)", "status": "degraded" },
      { "name": "MC 900 (CAAMI)", "status": "online" }
    ]$$::jsonb
  )
on conflict (scope, section_key) do update
set
  payload = excluded.payload,
  updated_at = timezone('utc', now());
