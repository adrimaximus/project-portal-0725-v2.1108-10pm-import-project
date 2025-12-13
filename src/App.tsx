import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoadingScreen from './components/LoadingScreen';
import AuthHandler from './components/AuthHandler';
import ProtectedRouteLayout from './components/ProtectedRouteLayout';
import GlobalTaskDrawer from './components/GlobalTaskDrawer';
import GlobalTaskModal from './components/GlobalTaskModal';

// Lazy load pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'));
const IndexPage = lazy(() => import('./pages/Index'));
const ProjectsPage = lazy(() => import('./pages/Projects'));
const ProjectDetailPage = lazy(() => import('./pages/projects/[slug]'));
const RequestPage = lazy(() => import('./pages/Request'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const MoodTrackerPage = lazy(() => import('./pages/MoodTracker'));
const GoalsPage = lazy(() => import('./pages/Goals'));
const GoalDetailPage = lazy(() => import('./pages/GoalDetailPage'));
const BillingPage = lazy(() => import('./pages/Billing'));
const ExpensePage = lazy(() => import('./pages/Expense'));
const PeoplePage = lazy(() => import('./pages/PeoplePage'));
const PersonProfilePage = lazy(() => import('./pages/people/PersonProfilePage'));
const CompanyProfilePage = lazy(() => import('./pages/CompanyProfilePage'));
const KnowledgeBasePage = lazy(() => import('./pages/KnowledgeBasePage'));
const FolderDetailPage = lazy(() => import('./pages/kb/FolderDetailPage'));
const Page = lazy(() => import('./pages/kb/Page'));
const NotificationsPage = lazy(() => import('./pages/Notifications'));
const PublicationPage = lazy(() => import('./pages/Publication'));
const ProfilePage = lazy(() => import('./pages/Profile'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const UserManagementPage = lazy(() => import('./pages/UserManagement'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const WorkspaceSettingsPage = lazy(() => import('./pages/WorkspaceSettingsPage'));
const TeamSettingsPage = lazy(() => import('./pages/TeamSettingsPage'));
const NavigationSettingsPage = lazy(() => import('./pages/NavigationSettingsPage'));
const TagsSettingsPage = lazy(() => import('./pages/TagsSettingsPage'));
const ThemeSettingsPage = lazy(() => import('./pages/ThemeSettingsPage'));
const ServicesSettingsPage = lazy(() => import('./pages/ServicesSettingsPage'));
const IntegrationsPage = lazy(() => import('./pages/IntegrationsPage'));
const GoogleDrivePage = lazy(() => import('./pages/integrations/GoogleDrivePage'));
const GoogleCalendarIntegrationPage = lazy(() => import('./pages/integrations/GoogleCalendarIntegrationPage'));
const OpenAiIntegrationPage = lazy(() => import('./pages/integrations/OpenAiIntegrationPage'));
const WbiztoolPage = lazy(() => import('./pages/integrations/WbiztoolPage'));
const EmailitPage = lazy(() => import('./pages/integrations/EmailitPage'));
const CustomPage = lazy(() => import('./pages/CustomPage'));
const MultiEmbedPage = lazy(() => import('./pages/MultiEmbedPage'));
const MultiEmbedItemPage = lazy(() => import('./pages/MultiEmbedItemPage'));
const EmbedPage = lazy(() => import('./pages/EmbedPage'));
const TaskRedirectPage = lazy(() => import('./pages/TaskRedirectPage'));
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'));
const StorageSettingsPage = lazy(() => import('./pages/StorageSettingsPage'));
const PropertiesSettingsPage = lazy(() => import('./pages/PropertiesSettingsPage'));
const ContactPropertiesPage = lazy(() => import('./pages/ContactPropertiesPage'));
const CompanyPropertiesPage = lazy(() => import('./pages/CompanyPropertiesPage'));
const ProjectStatusesPage = lazy(() => import('./pages/settings/ProjectStatusesPage'));
const BillingPropertiesPage = lazy(() => import('./pages/BillingPropertiesPage'));
const PaymentStatusesPage = lazy(() => import('./pages/settings/PaymentStatusesPage'));
const CustomBillingFieldsPage = lazy(() => import('./pages/settings/CustomBillingFieldsPage'));
const ExpensePropertiesPage = lazy(() => import('./pages/ExpensePropertiesPage'));
const TagsPropertiesPage = lazy(() => import('./pages/TagsPropertiesPage'));
const BankAccountsPage = lazy(() => import('./pages/BankAccountsPage'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  return (
    <>
      <AuthHandler />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/landing" element={<LandingPage />} />

          <Route element={<ProtectedRouteLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<IndexPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:slug" element={<ProjectDetailPage />} />
            <Route path="/tasks/:taskId" element={<TaskRedirectPage />} />
            <Route path="/request" element={<RequestPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/mood-tracker" element={<MoodTrackerPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/goals/:slug" element={<GoalDetailPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/expense" element={<ExpensePage />} />
            <Route path="/people" element={<PeoplePage />} />
            <Route path="/people/:slug" element={<PersonProfilePage />} />
            <Route path="/companies/:slug" element={<CompanyProfilePage />} />
            <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
            <Route path="/knowledge-base/folders/:slug" element={<FolderDetailPage />} />
            <Route path="/knowledge-base/pages/:slug" element={<Page />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/publication" element={<PublicationPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/users" element={<UserManagementPage />} />
            <Route path="/users/:id" element={<UserProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/workspace" element={<WorkspaceSettingsPage />} />
            <Route path="/settings/team" element={<TeamSettingsPage />} />
            <Route path="/settings/navigation" element={<NavigationSettingsPage />} />
            <Route path="/settings/tags" element={<TagsSettingsPage />} />
            <Route path="/settings/theme" element={<ThemeSettingsPage />} />
            <Route path="/settings/services" element={<ServicesSettingsPage />} />
            <Route path="/settings/integrations" element={<IntegrationsPage />} />
            <Route path="/settings/integrations/google-drive" element={<GoogleDrivePage />} />
            <Route path="/settings/integrations/google-calendar" element={<GoogleCalendarIntegrationPage />} />
            <Route path="/settings/integrations/openai" element={<OpenAiIntegrationPage />} />
            <Route path="/settings/integrations/wbiztool" element={<WbiztoolPage />} />
            <Route path="/settings/integrations/emailit" element={<EmailitPage />} />
            <Route path="/settings/storage" element={<StorageSettingsPage />} />
            <Route path="/settings/properties" element={<PropertiesSettingsPage />} />
            <Route path="/settings/people-properties" element={<ContactPropertiesPage />} />
            <Route path="/settings/company-properties" element={<CompanyPropertiesPage />} />
            <Route path="/settings/project-statuses" element={<ProjectStatusesPage />} />
            <Route path="/settings/billing-properties" element={<BillingPropertiesPage />} />
            <Route path="/settings/payment-statuses" element={<PaymentStatusesPage />} />
            <Route path="/settings/custom-billing-fields" element={<CustomBillingFieldsPage />} />
            <Route path="/settings/expense-properties" element={<ExpensePropertiesPage />} />
            <Route path="/settings/tags-properties" element={<TagsPropertiesPage />} />
            <Route path="/settings/bank-accounts" element={<BankAccountsPage />} />
            <Route path="/custom/:slug" element={<CustomPage />} />
            <Route path="/multipage/:slug" element={<MultiEmbedPage />} />
            <Route path="/multipage/:slug/:itemSlug" element={<MultiEmbedItemPage />} />
            <Route path="/embed" element={<EmbedPage />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <GlobalTaskDrawer />
      <GlobalTaskModal />
    </>
  );
}

export default App;