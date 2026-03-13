import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { PageSkeleton } from '@/design-system/PageSkeleton';

// Layouts (eager — small, always needed)
import { AuthLayout } from '@/layouts/AuthLayout';
import { NurseLayout } from '@/layouts/NurseLayout';
import { CoordinatorLayout } from '@/layouts/CoordinatorLayout';
import { PatientLayout } from '@/layouts/PatientLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { BillingLayout } from '@/layouts/BillingLayout';

// Auth guards (eager)
import { RequireAuth } from '@/components/auth/RequireAuth';
import { RedirectIfAuth } from '@/components/auth/RedirectIfAuth';
import { useAuthStore } from '@/stores/authStore';

const routerFuture = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;

// ── Lazy Pages ──────────────────────────────────────────

// Auth
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const OnboardingPage = lazy(() => import('@/pages/auth/OnboardingPage').then(m => ({ default: m.OnboardingPage })));

// Nurse
const DashboardPage = lazy(() => import('@/pages/nurse/DashboardPage').then(m => ({ default: m.DashboardPage })));
const NfcIdentifyPage = lazy(() => import('@/pages/nurse/NfcIdentifyPage').then(m => ({ default: m.NfcIdentifyPage })));
const PatientsListPage = lazy(() => import('@/pages/nurse/PatientsListPage').then(m => ({ default: m.PatientsListPage })));
const PatientDetailPage = lazy(() => import('@/pages/nurse/PatientDetailPage').then(m => ({ default: m.PatientDetailPage })));
const SmartVisitBriefingPage = lazy(() => import('@/pages/nurse/SmartVisitBriefingPage').then(m => ({ default: m.SmartVisitBriefingPage })));
const TourPage = lazy(() => import('@/pages/nurse/TourPage').then(m => ({ default: m.TourPage })));
const TourMapPage = lazy(() => import('@/pages/nurse/TourMapPage').then(m => ({ default: m.TourMapPage })));
const ActiveVisitPage = lazy(() => import('@/pages/nurse/ActiveVisitPage').then(m => ({ default: m.ActiveVisitPage })));
const WoundCarePage = lazy(() => import('@/pages/nurse/WoundCarePage').then(m => ({ default: m.WoundCarePage })));
const BillingPage = lazy(() => import('@/pages/nurse/BillingPage').then(m => ({ default: m.BillingPage })));
const KatzEvaluationPage = lazy(() => import('@/pages/nurse/KatzEvaluationPage').then(m => ({ default: m.KatzEvaluationPage })));
const NewPatientPage = lazy(() => import('@/pages/nurse/NewPatientPage').then(m => ({ default: m.NewPatientPage })));
const VisitSummaryPage = lazy(() => import('@/pages/nurse/VisitSummaryPage').then(m => ({ default: m.VisitSummaryPage })));
const ProfileSettingsPage = lazy(() => import('@/pages/shared/ProfileSettingsPage').then(m => ({ default: m.ProfileSettingsPage })));
const SettingsPage = lazy(() => import('@/pages/nurse/SettingsPage').then(m => ({ default: m.SettingsPage })));
const EHealthBoxPage = lazy(() => import('@/pages/nurse/EHealthBoxPage').then(m => ({ default: m.EHealthBoxPage })));
const BelRAIScreenerPage = lazy(() => import('@/pages/nurse/BelRAIScreenerPage').then(m => ({ default: m.BelRAIScreenerPage })));
const VitalinkPage = lazy(() => import('@/pages/nurse/VitalinkPage').then(m => ({ default: m.VitalinkPage })));
const EAgreementPage = lazy(() => import('@/pages/nurse/EAgreementPage').then(m => ({ default: m.EAgreementPage })));
const ConsentPage = lazy(() => import('@/pages/nurse/ConsentPage').then(m => ({ default: m.ConsentPage })));
const HourlyComparisonPage = lazy(() => import('@/pages/nurse/HourlyComparisonPage').then(m => ({ default: m.HourlyComparisonPage })));
const ReportGeneratorPage = lazy(() => import('@/pages/nurse/ReportGeneratorPage').then(m => ({ default: m.ReportGeneratorPage })));
const TeleconsultationPage = lazy(() => import('@/pages/nurse/TeleconsultationPage').then(m => ({ default: m.TeleconsultationPage })));
const PredictiveDashboardPage = lazy(() => import('@/pages/nurse/PredictiveDashboardPage').then(m => ({ default: m.PredictiveDashboardPage })));
const HealthHubPage = lazy(() => import('@/pages/nurse/HealthHubPage').then(m => ({ default: m.HealthHubPage })));
const EFactPage = lazy(() => import('@/pages/nurse/EFactPage').then(m => ({ default: m.EFactPage })));
const MorePage = lazy(() => import('@/pages/nurse/MorePage').then(m => ({ default: m.MorePage })));
const NursingJournalPage = lazy(() => import('@/pages/nurse/NursingJournalPage').then(m => ({ default: m.NursingJournalPage })));
const ASDPage = lazy(() => import('@/pages/nurse/ASDPage').then(m => ({ default: m.ASDPage })));
const CarePlanPage = lazy(() => import('@/pages/nurse/CarePlanPage').then(m => ({ default: m.CarePlanPage })));
const NotificationsPage = lazy(() => import('@/pages/nurse/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const ScheduleAvailabilityPage = lazy(() => import('@/pages/nurse/ScheduleAvailabilityPage').then(m => ({ default: m.ScheduleAvailabilityPage })));
const TeamChatPage = lazy(() => import('@/pages/nurse/TeamChatPage').then(m => ({ default: m.TeamChatPage })));
const IncidentReportPage = lazy(() => import('@/pages/nurse/IncidentReportPage').then(m => ({ default: m.IncidentReportPage })));
const StatisticsPage = lazy(() => import('@/pages/nurse/StatisticsPage').then(m => ({ default: m.StatisticsPage })));
const MileageTrackerPage = lazy(() => import('@/pages/nurse/MileageTrackerPage').then(m => ({ default: m.MileageTrackerPage })));
const EmergencyProtocolsPage = lazy(() => import('@/pages/nurse/EmergencyProtocolsPage').then(m => ({ default: m.EmergencyProtocolsPage })));
const InventoryPage = lazy(() => import('@/pages/nurse/InventoryPage').then(m => ({ default: m.InventoryPage })));
const ContinuingEducationPage = lazy(() => import('@/pages/nurse/ContinuingEducationPage').then(m => ({ default: m.ContinuingEducationPage })));
const DrugInteractionCheckerPage = lazy(() => import('@/pages/nurse/DrugInteractionCheckerPage').then(m => ({ default: m.DrugInteractionCheckerPage })));
const PatientHandoverPage = lazy(() => import('@/pages/nurse/PatientHandoverPage').then(m => ({ default: m.PatientHandoverPage })));
const DocumentScannerPage = lazy(() => import('@/pages/nurse/DocumentScannerPage').then(m => ({ default: m.DocumentScannerPage })));
const HADEpisodesPage = lazy(() => import('@/pages/nurse/HADEpisodesPage').then(m => ({ default: m.HADEpisodesPage })));
const HADEpisodeDetailPage = lazy(() => import('@/pages/nurse/HADEpisodeDetailPage').then(m => ({ default: m.HADEpisodeDetailPage })));

// Coordinator
const CoordinatorDashboard = lazy(() => import('@/pages/coordinator/CoordinatorDashboard').then(m => ({ default: m.CoordinatorDashboard })));
const PlanningPage = lazy(() => import('@/pages/coordinator/PlanningPage').then(m => ({ default: m.PlanningPage })));
const TeamPage = lazy(() => import('@/pages/coordinator/TeamPage').then(m => ({ default: m.TeamPage })));
const CoordinatorBillingPage = lazy(() => import('@/pages/coordinator/CoordinatorBillingPage').then(m => ({ default: m.CoordinatorBillingPage })));
const StatsPage = lazy(() => import('@/pages/coordinator/StatsPage').then(m => ({ default: m.StatsPage })));
const ReconciliationPage = lazy(() => import('@/pages/coordinator/ReconciliationPage').then(m => ({ default: m.ReconciliationPage })));
const ShiftPage = lazy(() => import('@/pages/coordinator/ShiftPage').then(m => ({ default: m.ShiftPage })));
const LiveMapPage = lazy(() => import('@/pages/coordinator/LiveMapPage').then(m => ({ default: m.LiveMapPage })));
const MessagesPage = lazy(() => import('@/pages/coordinator/MessagesPage').then(m => ({ default: m.MessagesPage })));
const AbsencesPage = lazy(() => import('@/pages/coordinator/AbsencesPage').then(m => ({ default: m.AbsencesPage })));
const PatientCaseloadPage = lazy(() => import('@/pages/coordinator/PatientCaseloadPage').then(m => ({ default: m.PatientCaseloadPage })));
const QualityPage = lazy(() => import('@/pages/coordinator/QualityPage').then(m => ({ default: m.QualityPage })));
const ContinuityPage = lazy(() => import('@/pages/coordinator/ContinuityPage').then(m => ({ default: m.ContinuityPage })));
const CoordinatorMorePage = lazy(() => import('@/pages/coordinator/CoordinatorMorePage').then(m => ({ default: m.CoordinatorMorePage })));
const HADCommandCenterPage = lazy(() => import('@/pages/coordinator/HADCommandCenterPage').then(m => ({ default: m.HADCommandCenterPage })));

// Patient Portal
const PatientHome = lazy(() => import('@/pages/patient/PatientHome').then(m => ({ default: m.PatientHome })));
const HealthPage = lazy(() => import('@/pages/patient/HealthPage').then(m => ({ default: m.HealthPage })));
const TreatmentsPage = lazy(() => import('@/pages/patient/TreatmentsPage').then(m => ({ default: m.TreatmentsPage })));
const ParametersPage = lazy(() => import('@/pages/patient/ParametersPage').then(m => ({ default: m.ParametersPage })));
const QuestionnairePage = lazy(() => import('@/pages/patient/QuestionnairePage').then(m => ({ default: m.QuestionnairePage })));
const DocumentsPage = lazy(() => import('@/pages/patient/DocumentsPage').then(m => ({ default: m.DocumentsPage })));
const MyBelRAIPage = lazy(() => import('@/pages/patient/MyBelRAIPage').then(m => ({ default: m.MyBelRAIPage })));
const FamilyPage = lazy(() => import('@/pages/patient/FamilyPage').then(m => ({ default: m.FamilyPage })));
const PatientMessagesPage = lazy(() => import('@/pages/patient/PatientMessagesPage').then(m => ({ default: m.PatientMessagesPage })));
const AppointmentsPage = lazy(() => import('@/pages/patient/AppointmentsPage').then(m => ({ default: m.AppointmentsPage })));
const CostTransparencyPage = lazy(() => import('@/pages/patient/CostTransparencyPage').then(m => ({ default: m.CostTransparencyPage })));
const CareDiaryPage = lazy(() => import('@/pages/patient/CareDiaryPage').then(m => ({ default: m.CareDiaryPage })));
const PatientMorePage = lazy(() => import('@/pages/patient/PatientMorePage').then(m => ({ default: m.PatientMorePage })));
const HospitalModePage = lazy(() => import('@/pages/patient/HospitalModePage').then(m => ({ default: m.HospitalModePage })));

// Admin
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const UsersPage = lazy(() => import('@/pages/admin/UsersPage').then(m => ({ default: m.UsersPage })));
const NomenclaturePage = lazy(() => import('@/pages/admin/NomenclaturePage').then(m => ({ default: m.NomenclaturePage })));
const MyCareNetPage = lazy(() => import('@/pages/admin/MyCareNetPage').then(m => ({ default: m.MyCareNetPage })));
const PilotPage = lazy(() => import('@/pages/admin/PilotPage').then(m => ({ default: m.PilotPage })));
const AuditPage = lazy(() => import('@/pages/admin/AuditPage').then(m => ({ default: m.AuditPage })));
const RGPDPage = lazy(() => import('@/pages/admin/RGPDPage').then(m => ({ default: m.RGPDPage })));
const SecurityCenterPage = lazy(() => import('@/pages/admin/SecurityCenterPage').then(m => ({ default: m.SecurityCenterPage })));
const CertificatesPage = lazy(() => import('@/pages/admin/CertificatesPage').then(m => ({ default: m.CertificatesPage })));
const DataGovernancePage = lazy(() => import('@/pages/admin/DataGovernancePage').then(m => ({ default: m.DataGovernancePage })));
const ConsentRegistryPage = lazy(() => import('@/pages/admin/ConsentRegistryPage').then(m => ({ default: m.ConsentRegistryPage })));
const IncidentResponsePage = lazy(() => import('@/pages/admin/IncidentResponsePage').then(m => ({ default: m.IncidentResponsePage })));
const BackupRecoveryPage = lazy(() => import('@/pages/admin/BackupRecoveryPage').then(m => ({ default: m.BackupRecoveryPage })));
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage').then(m => ({ default: m.AdminSettingsPage })));

// Billing Office
const BillingDashboardPage = lazy(() => import('@/pages/billing/BillingDashboardPage').then(m => ({ default: m.BillingDashboardPage })));
const WorkQueuePage = lazy(() => import('@/pages/billing/WorkQueuePage').then(m => ({ default: m.WorkQueuePage })));
const EFactBatchesPage = lazy(() => import('@/pages/billing/EFactBatchesPage').then(m => ({ default: m.EFactBatchesPage })));
const RejectionsPage = lazy(() => import('@/pages/billing/RejectionsPage').then(m => ({ default: m.RejectionsPage })));
const CorrectionsPage = lazy(() => import('@/pages/billing/CorrectionsPage').then(m => ({ default: m.CorrectionsPage })));
const ReportsPage = lazy(() => import('@/pages/billing/ReportsPage').then(m => ({ default: m.ReportsPage })));
const NomenclatureReferencePage = lazy(() => import('@/pages/billing/NomenclatureReferencePage').then(m => ({ default: m.NomenclatureReferencePage })));
const CumulRulesPage = lazy(() => import('@/pages/billing/CumulRulesPage').then(m => ({ default: m.CumulRulesPage })));
const BillingReconciliationPage = lazy(() => import('@/pages/billing/BillingReconciliationPage').then(m => ({ default: m.BillingReconciliationPage })));
const NurseProductivityPage = lazy(() => import('@/pages/billing/NurseProductivityPage').then(m => ({ default: m.NurseProductivityPage })));
const PatientAccountPage = lazy(() => import('@/pages/billing/PatientAccountPage').then(m => ({ default: m.PatientAccountPage })));
const AgreementManagerPage = lazy(() => import('@/pages/billing/AgreementManagerPage').then(m => ({ default: m.AgreementManagerPage })));
const TariffSimulatorPage = lazy(() => import('@/pages/billing/TariffSimulatorPage').then(m => ({ default: m.TariffSimulatorPage })));
const MutuelleDirectoryPage = lazy(() => import('@/pages/billing/MutuelleDirectoryPage').then(m => ({ default: m.MutuelleDirectoryPage })));
const BillingAuditPage = lazy(() => import('@/pages/billing/BillingAuditPage').then(m => ({ default: m.BillingAuditPage })));
const BillingSettingsPage = lazy(() => import('@/pages/billing/BillingSettingsPage').then(m => ({ default: m.BillingSettingsPage })));

export default function App() {
  const initializeAuth = useAuthStore((s) => s.initialize);

  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);
  return (
    <BrowserRouter future={routerFuture}>
      <AnimatePresence mode="wait">
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
          {/* ── Auth ── */}
          <Route element={<RedirectIfAuth><AuthLayout /></RedirectIfAuth>}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>
          <Route element={<AuthLayout />}>
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* ── Nurse ── */}
          <Route path="/nurse" element={<RequireAuth allowedRoles={['nurse']}><NurseLayout /></RequireAuth>}>
            <Route index element={<DashboardPage />} />
            <Route path="tour" element={<TourPage />} />
            <Route path="tour/map" element={<TourMapPage />} />
            <Route path="identify" element={<NfcIdentifyPage />} />
            <Route path="patients" element={<PatientsListPage />} />
            <Route path="patients/new" element={<NewPatientPage />} />
            <Route path="patients/:id" element={<PatientDetailPage />} />
            <Route path="briefing/:patientId" element={<SmartVisitBriefingPage />} />
            <Route path="visit/:id" element={<ActiveVisitPage />} />
            <Route path="visit/:id/summary" element={<VisitSummaryPage />} />
            <Route path="wounds/:id" element={<WoundCarePage />} />
            <Route path="katz/:patientId" element={<KatzEvaluationPage />} />
            <Route path="belrai/:patientId" element={<BelRAIScreenerPage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="vitalink/:patientId" element={<VitalinkPage />} />
            <Route path="eagreement" element={<EAgreementPage />} />
            <Route path="consent" element={<ConsentPage />} />
            <Route path="profile" element={<ProfileSettingsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="ehealthbox" element={<EHealthBoxPage />} />
            <Route path="hourly-comparison" element={<HourlyComparisonPage />} />
            <Route path="reports" element={<ReportGeneratorPage />} />
            <Route path="teleconsultation" element={<TeleconsultationPage />} />
            <Route path="predictive" element={<PredictiveDashboardPage />} />
            <Route path="health-hubs" element={<HealthHubPage />} />
            <Route path="billing/efact" element={<EFactPage />} />
            <Route path="had" element={<HADEpisodesPage />} />
            <Route path="had/:episodeId" element={<HADEpisodeDetailPage />} />
            <Route path="more" element={<MorePage />} />
            <Route path="journal" element={<NursingJournalPage />} />
            <Route path="asd" element={<ASDPage />} />
            <Route path="care-plan" element={<CarePlanPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="schedule" element={<ScheduleAvailabilityPage />} />
            <Route path="chat" element={<TeamChatPage />} />
            <Route path="incidents" element={<IncidentReportPage />} />
            <Route path="statistics" element={<StatisticsPage />} />
            <Route path="mileage" element={<MileageTrackerPage />} />
            <Route path="emergency" element={<EmergencyProtocolsPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="education" element={<ContinuingEducationPage />} />
            <Route path="drug-check" element={<DrugInteractionCheckerPage />} />
            <Route path="handover" element={<PatientHandoverPage />} />
            <Route path="scanner" element={<DocumentScannerPage />} />
          </Route>

          {/* ── Coordinator ── */}
          <Route path="/coordinator" element={<RequireAuth allowedRoles={['coordinator']}><CoordinatorLayout /></RequireAuth>}>
            <Route index element={<CoordinatorDashboard />} />
            <Route path="planning" element={<PlanningPage />} />
            <Route path="team" element={<TeamPage />} />
            <Route path="billing" element={<CoordinatorBillingPage />} />
            <Route path="stats" element={<StatsPage />} />
            <Route path="reconciliation" element={<ReconciliationPage />} />
            <Route path="shifts" element={<ShiftPage />} />
            <Route path="map" element={<LiveMapPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="absences" element={<AbsencesPage />} />
            <Route path="caseload" element={<PatientCaseloadPage />} />
            <Route path="quality" element={<QualityPage />} />
            <Route path="continuity" element={<ContinuityPage />} />
            <Route path="had-command-center" element={<HADCommandCenterPage />} />
            <Route path="profile" element={<ProfileSettingsPage />} />
            <Route path="more" element={<CoordinatorMorePage />} />
          </Route>

          {/* ── Patient Portal ── */}
          <Route path="/patient" element={<RequireAuth allowedRoles={['patient']}><PatientLayout /></RequireAuth>}>
            <Route index element={<PatientHome />} />
            <Route path="health" element={<HealthPage />} />
            <Route path="treatments" element={<TreatmentsPage />} />
            <Route path="belrai" element={<MyBelRAIPage />} />
            <Route path="parameters" element={<ParametersPage />} />
            <Route path="questionnaire" element={<QuestionnairePage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="family" element={<FamilyPage />} />
            <Route path="messages" element={<PatientMessagesPage />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="costs" element={<CostTransparencyPage />} />
            <Route path="diary" element={<CareDiaryPage />} />
            <Route path="hospital-mode" element={<HospitalModePage />} />
            <Route path="profile" element={<ProfileSettingsPage />} />
            <Route path="more" element={<PatientMorePage />} />
          </Route>

          {/* ── Admin ── */}
          <Route path="/admin" element={<RequireAuth allowedRoles={['admin']}><AdminLayout /></RequireAuth>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="security" element={<SecurityCenterPage />} />
            <Route path="nomenclature" element={<NomenclaturePage />} />
            <Route path="mycarenet" element={<MyCareNetPage />} />
            <Route path="certificates" element={<CertificatesPage />} />
            <Route path="pilot" element={<PilotPage />} />
            <Route path="audit" element={<AuditPage />} />
            <Route path="rgpd" element={<RGPDPage />} />
            <Route path="data-governance" element={<DataGovernancePage />} />
            <Route path="consents" element={<ConsentRegistryPage />} />
            <Route path="incidents" element={<IncidentResponsePage />} />
            <Route path="backups" element={<BackupRecoveryPage />} />
            <Route path="profile" element={<ProfileSettingsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>

          {/* ── Billing Office ── */}
          <Route path="/billing" element={<RequireAuth allowedRoles={['billing_office']}><BillingLayout /></RequireAuth>}>
            <Route index element={<BillingDashboardPage />} />
            <Route path="queue" element={<WorkQueuePage />} />
            <Route path="batches" element={<EFactBatchesPage />} />
            <Route path="rejections" element={<RejectionsPage />} />
            <Route path="corrections" element={<CorrectionsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="nomenclature" element={<NomenclatureReferencePage />} />
            <Route path="cumul-rules" element={<CumulRulesPage />} />
            <Route path="reconciliation" element={<BillingReconciliationPage />} />
            <Route path="nurse-stats" element={<NurseProductivityPage />} />
            <Route path="patient-account" element={<PatientAccountPage />} />
            <Route path="agreements" element={<AgreementManagerPage />} />
            <Route path="simulator" element={<TariffSimulatorPage />} />
            <Route path="mutuelles" element={<MutuelleDirectoryPage />} />
            <Route path="audit" element={<BillingAuditPage />} />
            <Route path="profile" element={<ProfileSettingsPage />} />
            <Route path="settings" element={<BillingSettingsPage />} />
          </Route>

          {/* ── Default ── */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </AnimatePresence>
    </BrowserRouter>
  );
}
