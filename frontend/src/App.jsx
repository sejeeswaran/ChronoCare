import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { HealthDataProvider } from './context/HealthDataContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layout/AppLayout';
import Dashboard from './pages/Dashboard';
import ClinicalUpload from './pages/ClinicalUpload';
import WearableInsights from './pages/WearableInsights';
import TimelineView from './pages/TimelineView';
import AlertsCenter from './pages/AlertsCenter';
import DiseaseDetail from './pages/DiseaseDetail';
import LoginPage from './pages/LoginPage';

function App() {
  return (
    <AuthProvider>
      <HealthDataProvider>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="upload" element={<ClinicalUpload />} />
            <Route path="wearables" element={<WearableInsights />} />
            <Route path="timeline" element={<TimelineView />} />
            <Route path="alerts" element={<AlertsCenter />} />
            <Route path="disease/:name" element={<DiseaseDetail />} />
          </Route>
        </Routes>
      </HealthDataProvider>
    </AuthProvider>
  );
}

export default App;
