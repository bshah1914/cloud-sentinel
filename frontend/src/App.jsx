import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import Login from './pages/Login';
import Overview from './pages/Overview';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Audit from './pages/Audit';
import Resources from './pages/Resources';
import IAM from './pages/IAM';
import SecurityGroups from './pages/SecurityGroups';
import Scan from './pages/Scan';
import Users from './pages/Users';
import Report from './pages/Report';
import Compliance from './pages/Compliance';
import Docs from './pages/Docs';
import Threats from './pages/Threats';
import Pricing from './pages/Pricing';
import Support from './pages/Support';
import AdminPanel from './pages/AdminPanel';
import ClientDashboard from './pages/ClientDashboard';
import MyAccount from './pages/MyAccount';
import Executive from './pages/Executive';
import AuditLog from './pages/AuditLog';
import AlertRules from './pages/AlertRules';
import CustomDashboard from './pages/CustomDashboard';
import BrandingSettings from './pages/BrandingSettings';
import DashboardManager from './pages/DashboardManager';
import AiDashboard from './pages/AiDashboard';
import Remediation from './pages/Remediation';
import KioskMode from './pages/KioskMode';
import InfraMonitoring from './pages/InfraMonitoring';
import LogExplorer from './pages/LogExplorer';
import MonitoringAlerts from './pages/MonitoringAlerts';
import AiAnalysis from './pages/AiAnalysis';
import SecurityCenter from './pages/SecurityCenter';
import AvailabilityMonitoring from './pages/AvailabilityMonitoring';
import Kubernetes from './pages/Kubernetes';
import ApiPerformance from './pages/ApiPerformance';
import DatabasePerformance from './pages/DatabasePerformance';
import FunctionPerformance from './pages/FunctionPerformance';
import Notifications from './pages/Notifications';
import PlatformHealth from './pages/PlatformHealth';
import Loader from './components/Loader';

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Loader text="Checking authentication..." />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const isClient = user.user_type === 'client';

  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Owner/Admin Routes */}
        {!isClient && (
          <>
            <Route path="/" element={<Overview />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/audit" element={<Audit />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/iam" element={<IAM />} />
            <Route path="/security-groups" element={<SecurityGroups />} />
            <Route path="/scan" element={<Scan />} />
            <Route path="/users" element={<Users />} />
            <Route path="/report" element={<Report />} />
            <Route path="/compliance" element={<Compliance />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/threats" element={<Threats />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/support" element={<Support />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/executive" element={<Executive />} />
            <Route path="/audit-log" element={<AuditLog />} />
            <Route path="/alert-rules" element={<AlertRules />} />
            <Route path="/custom-dashboard" element={<CustomDashboard />} />
            <Route path="/custom-dashboard/:id" element={<CustomDashboard />} />
            <Route path="/dashboard-manager" element={<DashboardManager />} />
            <Route path="/branding" element={<BrandingSettings />} />
            <Route path="/ai-dashboard" element={<AiDashboard />} />
            <Route path="/remediation" element={<Remediation />} />
            <Route path="/infra-monitoring" element={<InfraMonitoring />} />
            <Route path="/logs" element={<LogExplorer />} />
            <Route path="/monitoring-alerts" element={<MonitoringAlerts />} />
            <Route path="/ai-analysis" element={<AiAnalysis />} />
            <Route path="/security-center" element={<SecurityCenter />} />
            <Route path="/availability" element={<AvailabilityMonitoring />} />
            <Route path="/kubernetes" element={<Kubernetes />} />
            <Route path="/api-performance" element={<ApiPerformance />} />
            <Route path="/db-performance" element={<DatabasePerformance />} />
            <Route path="/function-performance" element={<FunctionPerformance />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/platform-health" element={<PlatformHealth />} />
          </>
        )}

        {/* Client Routes */}
        {isClient && (
          <>
            <Route path="/" element={<ClientDashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/compliance" element={<Compliance />} />
            <Route path="/threats" element={<Threats />} />
            <Route path="/report" element={<Report />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/scan" element={<Scan />} />
            <Route path="/support" element={<Support />} />
            <Route path="/my-account" element={<MyAccount />} />
          </>
        )}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function LoginRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Loader text="Checking authentication..." />
      </div>
    );
  }
  if (user) return <Navigate to="/" replace />;
  return <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter basename={(() => { const p = window.location.pathname; const m = p.match(/^(\/[^/]+)\//); return (m && m[1] !== '/api') ? m[1] : '/'; })()}>
          <Routes>
            <Route path="/login" element={<LoginRoute />} />
            <Route path="/kiosk" element={<KioskMode />} />
            <Route path="/kiosk/:id" element={<KioskMode />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
