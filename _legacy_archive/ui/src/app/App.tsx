import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@features/auth/store/authStore';
import { MapPage } from '@features/map/pages/MapPage';
import { LoginPage } from '@features/auth/pages/LoginPage';
import { AnalysisPage } from '@features/analysis/pages/AnalysisPage';
import { ReportPage } from '@features/reports/pages/ReportPage';
import { AppShell } from '@app/layout/AppShell';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes wrapped in AppShell (sidebar + nav) */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <AppShell />
          </PrivateRoute>
        }
      >
        <Route index element={<MapPage />} />
        <Route path="analysis/:jobId" element={<AnalysisPage />} />
        <Route path="reports/:reportId" element={<ReportPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
