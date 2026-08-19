import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './components/AppShell';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { FarmMapPage } from './pages/FarmMapPage';
import { FieldDetailPage } from './pages/FieldDetailPage';
import { HerdPage } from './pages/HerdPage';
import { MoneyHubPage } from './pages/MoneyHubPage';
import { FertiliserPlanPage } from './pages/FertiliserPlanPage';
import { GroupBuyPage } from './pages/GroupBuyPage';
import { ProfitabilityPage } from './pages/ProfitabilityPage';
import { AssistantPage } from './pages/AssistantPage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/map" element={<FarmMapPage />} />
              <Route path="/map/fields/:fieldId" element={<FieldDetailPage />} />
              <Route path="/herd" element={<HerdPage />} />
              <Route path="/money" element={<MoneyHubPage />} />
              <Route path="/money/fertiliser-plan" element={<FertiliserPlanPage />} />
              <Route path="/money/group-buy" element={<GroupBuyPage />} />
              <Route path="/money/profitability" element={<ProfitabilityPage />} />
              <Route path="/assistant" element={<AssistantPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
