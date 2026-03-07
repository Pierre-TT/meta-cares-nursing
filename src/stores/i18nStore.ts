import { create } from 'zustand';

export type Locale = 'fr' | 'nl' | 'de';

type TranslationKeys = Record<keyof typeof fr, string>;

/* ─── French (default) ─── */
const fr = {
  // Common
  'common.save': 'Enregistrer',
  'common.cancel': 'Annuler',
  'common.delete': 'Supprimer',
  'common.edit': 'Modifier',
  'common.search': 'Rechercher',
  'common.back': 'Retour',
  'common.next': 'Suivant',
  'common.previous': 'Précédent',
  'common.loading': 'Chargement…',
  'common.yes': 'Oui',
  'common.no': 'Non',
  'common.send': 'Envoyer',
  'common.close': 'Fermer',
  'common.confirm': 'Confirmer',
  'common.all': 'Tous',
  'common.status': 'Statut',
  'common.date': 'Date',
  'common.actions': 'Actions',
  'common.name': 'Nom',
  'common.patient': 'Patient',
  'common.nurse': 'Infirmier(ère)',

  // Nav
  'nav.dashboard': 'Tableau de bord',
  'nav.tour': 'Tournée',
  'nav.patients': 'Patients',
  'nav.billing': 'Facturation',
  'nav.more': 'Plus',
  'nav.profile': 'Profil',
  'nav.settings': 'Paramètres',
  'nav.planning': 'Planning',
  'nav.team': 'Équipe',
  'nav.stats': 'Statistiques',
  'nav.users': 'Utilisateurs',
  'nav.nomenclature': 'Nomenclature',
  'nav.audit': 'Audit',

  // Dashboard
  'dashboard.title': 'Tableau de bord',
  'dashboard.visits_today': 'Visites aujourd\'hui',
  'dashboard.visits_done': 'Terminées',
  'dashboard.revenue': 'Chiffre d\'affaires',
  'dashboard.next_visit': 'Prochaine visite',
  'dashboard.start_tour': 'Démarrer la tournée',

  // Tour
  'tour.title': 'Ma Tournée',
  'tour.visits': 'Visites',
  'tour.total_duration': 'Durée totale',
  'tour.distance': 'Distance',
  'tour.revenue': 'CA prévu',
  'tour.map': 'Carte',
  'tour.completed': 'Terminée',
  'tour.current': 'En cours',
  'tour.upcoming': 'À venir',
  'tour.cancelled': 'Annulée',
  'tour.call': 'Appeler',
  'tour.gps': 'GPS',
  'tour.start': 'Démarrer',
  'tour.transfer': 'Transférer cette visite',
  'tour.transfer_to': 'Transférer à :',

  // Visit
  'visit.identification': 'Patient',
  'visit.vitals': 'Paramètres',
  'visit.acts': 'Actes',
  'visit.notes': 'Notes',
  'visit.summary': 'Résumé',
  'visit.duration': 'Durée',
  'visit.value_w': 'Valeur W',
  'visit.estimated_amount': 'Montant estimé',
  'visit.signature': 'Signature patient',
  'visit.validate': 'Valider la visite',
  'visit.dictate': 'Dicter',
  'visit.stop_recording': 'Arrêter',
  'visit.recording': 'Enregistrement en cours — parlez maintenant…',
  'visit.scan_medication': 'Scanner médicament',
  'visit.photo': 'Photo',

  // Patients
  'patients.title': 'Mes Patients',
  'patients.new': 'Nouveau Patient',
  'patients.search': 'Rechercher un patient…',
  'patients.katz': 'Katz',
  'patients.allergies': 'Allergies',

  // Billing
  'billing.title': 'Facturation',
  'billing.efact': 'eFact',
  'billing.rejections': 'Rejets',
  'billing.corrections': 'Corrections',
  'billing.reports': 'Rapports',
  'billing.work_queue': 'File de travail',
  'billing.pending': 'En attente',
  'billing.sent': 'Envoyé',
  'billing.accepted': 'Accepté',
  'billing.rejected': 'Rejeté',

  // eHealth
  'ehealth.ehealthbox': 'eHealthBox',
  'ehealth.vitalink': 'Vitalink',
  'ehealth.eagreement': 'eAgreement',
  'ehealth.consent': 'Consentements',
  'ehealth.belrai': 'BelRAI Screener',
  'ehealth.mycarenet': 'MyCareNet',

  // Wound care
  'wound.title': 'Soins de plaie',
  'wound.location': 'Localisation',
  'wound.assessment': 'Évaluation',
  'wound.photos': 'Photos',
  'wound.evolution': 'Évolution',
  'wound.reminder': 'Rappel plaie',

  // Settings
  'settings.title': 'Paramètres',
  'settings.language': 'Langue',
  'settings.theme': 'Thème',
  'settings.notifications': 'Notifications',
  'settings.sync': 'Synchronisation',
  'settings.ehealth_status': 'Statut eHealth',

  // Roles
  'role.nurse': 'Infirmier(ère)',
  'role.coordinator': 'Coordinateur',
  'role.admin': 'Administrateur',
  'role.patient': 'Patient',
  'role.billing_office': 'Bureau de tarification',

  // PDF / Reports
  'report.generate': 'Générer le rapport',
  'report.download': 'Télécharger',
  'report.send_ehealthbox': 'Envoyer via eHealthBox',
  'report.katz_report': 'Rapport Katz',
  'report.belrai_report': 'Rapport BelRAI',
  'report.wound_report': 'Rapport plaie',
  'report.visit_report': 'Rapport de visite',

  // Teleconsultation
  'telecons.title': 'Téléconsultation',
  'telecons.start': 'Démarrer l\'appel',
  'telecons.end': 'Terminer',
  'telecons.mute': 'Couper le micro',
  'telecons.camera': 'Caméra',
  'telecons.chat': 'Chat',

  // Predictive
  'predictive.title': 'Risque de réhospitalisation',
  'predictive.low': 'Faible',
  'predictive.medium': 'Modéré',
  'predictive.high': 'Élevé',
} as const;

/* ─── Dutch ─── */
const nl: TranslationKeys = {
  'common.save': 'Opslaan',
  'common.cancel': 'Annuleren',
  'common.delete': 'Verwijderen',
  'common.edit': 'Bewerken',
  'common.search': 'Zoeken',
  'common.back': 'Terug',
  'common.next': 'Volgende',
  'common.previous': 'Vorige',
  'common.loading': 'Laden…',
  'common.yes': 'Ja',
  'common.no': 'Nee',
  'common.send': 'Verzenden',
  'common.close': 'Sluiten',
  'common.confirm': 'Bevestigen',
  'common.all': 'Alle',
  'common.status': 'Status',
  'common.date': 'Datum',
  'common.actions': 'Acties',
  'common.name': 'Naam',
  'common.patient': 'Patiënt',
  'common.nurse': 'Verpleegkundige',

  'nav.dashboard': 'Dashboard',
  'nav.tour': 'Ronde',
  'nav.patients': 'Patiënten',
  'nav.billing': 'Facturatie',
  'nav.more': 'Meer',
  'nav.profile': 'Profiel',
  'nav.settings': 'Instellingen',
  'nav.planning': 'Planning',
  'nav.team': 'Team',
  'nav.stats': 'Statistieken',
  'nav.users': 'Gebruikers',
  'nav.nomenclature': 'Nomenclatuur',
  'nav.audit': 'Audit',

  'dashboard.title': 'Dashboard',
  'dashboard.visits_today': 'Bezoeken vandaag',
  'dashboard.visits_done': 'Voltooid',
  'dashboard.revenue': 'Omzet',
  'dashboard.next_visit': 'Volgend bezoek',
  'dashboard.start_tour': 'Start ronde',

  'tour.title': 'Mijn Ronde',
  'tour.visits': 'Bezoeken',
  'tour.total_duration': 'Totale duur',
  'tour.distance': 'Afstand',
  'tour.revenue': 'Verwachte omzet',
  'tour.map': 'Kaart',
  'tour.completed': 'Voltooid',
  'tour.current': 'Huidig',
  'tour.upcoming': 'Gepland',
  'tour.cancelled': 'Geannuleerd',
  'tour.call': 'Bellen',
  'tour.gps': 'GPS',
  'tour.start': 'Starten',
  'tour.transfer': 'Dit bezoek overdragen',
  'tour.transfer_to': 'Overdragen aan:',

  'visit.identification': 'Patiënt',
  'visit.vitals': 'Parameters',
  'visit.acts': 'Handelingen',
  'visit.notes': 'Notities',
  'visit.summary': 'Samenvatting',
  'visit.duration': 'Duur',
  'visit.value_w': 'W-waarde',
  'visit.estimated_amount': 'Geschat bedrag',
  'visit.signature': 'Handtekening patiënt',
  'visit.validate': 'Bezoek bevestigen',
  'visit.dictate': 'Dicteren',
  'visit.stop_recording': 'Stoppen',
  'visit.recording': 'Opname bezig — spreek nu…',
  'visit.scan_medication': 'Medicatie scannen',
  'visit.photo': 'Foto',

  'patients.title': 'Mijn Patiënten',
  'patients.new': 'Nieuwe Patiënt',
  'patients.search': 'Zoek een patiënt…',
  'patients.katz': 'Katz',
  'patients.allergies': 'Allergieën',

  'billing.title': 'Facturatie',
  'billing.efact': 'eFact',
  'billing.rejections': 'Afwijzingen',
  'billing.corrections': 'Correcties',
  'billing.reports': 'Rapporten',
  'billing.work_queue': 'Werkwachtrij',
  'billing.pending': 'In afwachting',
  'billing.sent': 'Verzonden',
  'billing.accepted': 'Aanvaard',
  'billing.rejected': 'Afgewezen',

  'ehealth.ehealthbox': 'eHealthBox',
  'ehealth.vitalink': 'Vitalink',
  'ehealth.eagreement': 'eAgreement',
  'ehealth.consent': 'Toestemmingen',
  'ehealth.belrai': 'BelRAI Screener',
  'ehealth.mycarenet': 'MyCareNet',

  'wound.title': 'Wondverzorging',
  'wound.location': 'Locatie',
  'wound.assessment': 'Beoordeling',
  'wound.photos': 'Foto\'s',
  'wound.evolution': 'Evolutie',
  'wound.reminder': 'Wondherinnering',

  'settings.title': 'Instellingen',
  'settings.language': 'Taal',
  'settings.theme': 'Thema',
  'settings.notifications': 'Meldingen',
  'settings.sync': 'Synchronisatie',
  'settings.ehealth_status': 'eHealth-status',

  'role.nurse': 'Verpleegkundige',
  'role.coordinator': 'Coördinator',
  'role.admin': 'Beheerder',
  'role.patient': 'Patiënt',
  'role.billing_office': 'Tariferingsbureau',

  'report.generate': 'Rapport genereren',
  'report.download': 'Downloaden',
  'report.send_ehealthbox': 'Verzenden via eHealthBox',
  'report.katz_report': 'Katz-rapport',
  'report.belrai_report': 'BelRAI-rapport',
  'report.wound_report': 'Wondrapport',
  'report.visit_report': 'Bezoekrapport',

  'telecons.title': 'Teleconsultatie',
  'telecons.start': 'Oproep starten',
  'telecons.end': 'Beëindigen',
  'telecons.mute': 'Microfoon dempen',
  'telecons.camera': 'Camera',
  'telecons.chat': 'Chat',

  'predictive.title': 'Heropnamerisico',
  'predictive.low': 'Laag',
  'predictive.medium': 'Gemiddeld',
  'predictive.high': 'Hoog',
};

/* ─── German ─── */
const de: TranslationKeys = {
  'common.save': 'Speichern',
  'common.cancel': 'Abbrechen',
  'common.delete': 'Löschen',
  'common.edit': 'Bearbeiten',
  'common.search': 'Suchen',
  'common.back': 'Zurück',
  'common.next': 'Weiter',
  'common.previous': 'Zurück',
  'common.loading': 'Laden…',
  'common.yes': 'Ja',
  'common.no': 'Nein',
  'common.send': 'Senden',
  'common.close': 'Schließen',
  'common.confirm': 'Bestätigen',
  'common.all': 'Alle',
  'common.status': 'Status',
  'common.date': 'Datum',
  'common.actions': 'Aktionen',
  'common.name': 'Name',
  'common.patient': 'Patient',
  'common.nurse': 'Krankenpfleger(in)',

  'nav.dashboard': 'Dashboard',
  'nav.tour': 'Rundgang',
  'nav.patients': 'Patienten',
  'nav.billing': 'Abrechnung',
  'nav.more': 'Mehr',
  'nav.profile': 'Profil',
  'nav.settings': 'Einstellungen',
  'nav.planning': 'Planung',
  'nav.team': 'Team',
  'nav.stats': 'Statistiken',
  'nav.users': 'Benutzer',
  'nav.nomenclature': 'Nomenklatur',
  'nav.audit': 'Audit',

  'dashboard.title': 'Dashboard',
  'dashboard.visits_today': 'Besuche heute',
  'dashboard.visits_done': 'Abgeschlossen',
  'dashboard.revenue': 'Umsatz',
  'dashboard.next_visit': 'Nächster Besuch',
  'dashboard.start_tour': 'Rundgang starten',

  'tour.title': 'Mein Rundgang',
  'tour.visits': 'Besuche',
  'tour.total_duration': 'Gesamtdauer',
  'tour.distance': 'Entfernung',
  'tour.revenue': 'Erwarteter Umsatz',
  'tour.map': 'Karte',
  'tour.completed': 'Abgeschlossen',
  'tour.current': 'Aktuell',
  'tour.upcoming': 'Geplant',
  'tour.cancelled': 'Storniert',
  'tour.call': 'Anrufen',
  'tour.gps': 'GPS',
  'tour.start': 'Starten',
  'tour.transfer': 'Diesen Besuch übertragen',
  'tour.transfer_to': 'Übertragen an:',

  'visit.identification': 'Patient',
  'visit.vitals': 'Vitalwerte',
  'visit.acts': 'Leistungen',
  'visit.notes': 'Notizen',
  'visit.summary': 'Zusammenfassung',
  'visit.duration': 'Dauer',
  'visit.value_w': 'W-Wert',
  'visit.estimated_amount': 'Geschätzter Betrag',
  'visit.signature': 'Unterschrift Patient',
  'visit.validate': 'Besuch bestätigen',
  'visit.dictate': 'Diktieren',
  'visit.stop_recording': 'Stoppen',
  'visit.recording': 'Aufnahme läuft — sprechen Sie jetzt…',
  'visit.scan_medication': 'Medikament scannen',
  'visit.photo': 'Foto',

  'patients.title': 'Meine Patienten',
  'patients.new': 'Neuer Patient',
  'patients.search': 'Patient suchen…',
  'patients.katz': 'Katz',
  'patients.allergies': 'Allergien',

  'billing.title': 'Abrechnung',
  'billing.efact': 'eFact',
  'billing.rejections': 'Ablehnungen',
  'billing.corrections': 'Korrekturen',
  'billing.reports': 'Berichte',
  'billing.work_queue': 'Arbeitswarteschlange',
  'billing.pending': 'Ausstehend',
  'billing.sent': 'Gesendet',
  'billing.accepted': 'Akzeptiert',
  'billing.rejected': 'Abgelehnt',

  'ehealth.ehealthbox': 'eHealthBox',
  'ehealth.vitalink': 'Vitalink',
  'ehealth.eagreement': 'eAgreement',
  'ehealth.consent': 'Einwilligungen',
  'ehealth.belrai': 'BelRAI Screener',
  'ehealth.mycarenet': 'MyCareNet',

  'wound.title': 'Wundversorgung',
  'wound.location': 'Lokalisation',
  'wound.assessment': 'Beurteilung',
  'wound.photos': 'Fotos',
  'wound.evolution': 'Verlauf',
  'wound.reminder': 'Wundeninnerung',

  'settings.title': 'Einstellungen',
  'settings.language': 'Sprache',
  'settings.theme': 'Design',
  'settings.notifications': 'Benachrichtigungen',
  'settings.sync': 'Synchronisation',
  'settings.ehealth_status': 'eHealth-Status',

  'role.nurse': 'Krankenpfleger(in)',
  'role.coordinator': 'Koordinator',
  'role.admin': 'Administrator',
  'role.patient': 'Patient',
  'role.billing_office': 'Abrechnungsbüro',

  'report.generate': 'Bericht erstellen',
  'report.download': 'Herunterladen',
  'report.send_ehealthbox': 'Über eHealthBox senden',
  'report.katz_report': 'Katz-Bericht',
  'report.belrai_report': 'BelRAI-Bericht',
  'report.wound_report': 'Wundbericht',
  'report.visit_report': 'Besuchsbericht',

  'telecons.title': 'Telekonsultation',
  'telecons.start': 'Anruf starten',
  'telecons.end': 'Beenden',
  'telecons.mute': 'Mikrofon stumm',
  'telecons.camera': 'Kamera',
  'telecons.chat': 'Chat',

  'predictive.title': 'Rehospitalisierungsrisiko',
  'predictive.low': 'Niedrig',
  'predictive.medium': 'Mittel',
  'predictive.high': 'Hoch',
};

const translations: Record<Locale, TranslationKeys> = { fr, nl, de };

/* ─── Store ─── */
export type TranslationKey = keyof TranslationKeys;

interface I18nState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const storedLocale = (typeof localStorage !== 'undefined' && localStorage.getItem('mc-locale')) as Locale | null;
const initialLocale: Locale = storedLocale || 'fr';

export const useI18n = create<I18nState>((set, get) => ({
  locale: initialLocale,
  setLocale: (locale) => {
    localStorage.setItem('mc-locale', locale);
    document.documentElement.lang = locale;
    set({ locale });
  },
  t: (key) => {
    const { locale } = get();
    return translations[locale]?.[key] ?? translations.fr[key] ?? key;
  },
}));
