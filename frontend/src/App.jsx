import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WriteModeProvider } from './context/WriteModeContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Tenants from './pages/Tenants';
import TenantDetail from './pages/TenantDetail';
import Applications from './pages/Applications';
import ApplicationDetail from './pages/ApplicationDetail';
import SettingValues from './pages/SettingValues';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WriteModeProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tenants" element={<Tenants />} />
              <Route path="/tenants/:id" element={<TenantDetail />} />
              <Route path="/applications" element={<Applications />} />
              <Route path="/applications/:id" element={<ApplicationDetail />} />
              <Route path="/setting-values" element={<SettingValues />} />
            </Route>
          </Routes>
        </WriteModeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
