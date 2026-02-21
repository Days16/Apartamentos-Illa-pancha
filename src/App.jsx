import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from './lib/stripe';
import { useEffect, useState } from 'react';
import './index.css';
import './styles/responsive-utils.css';
import './styles/typography.css';
import './styles/forms.css';
import { fetchSettings } from './services/supabaseService';
import Maintenance from './pages/Maintenance';

// Páginas públicas
import Home from './pages/Home';
import Apartments from './pages/Apartments';
import ApartmentDetail from './pages/ApartmentDetail';
import About from './pages/About';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Cookies from './pages/Cookies';
import Terminos from './pages/Terminos';
import ProteccionDatos from './pages/ProteccionDatos';

// Panel de gestión
import GestionLayout from './pages/gestion/GestionLayout';
import Dashboard from './pages/gestion/Dashboard';
import Reservas from './pages/gestion/Reservas';
import Calendario from './pages/gestion/Calendario';
import Sync from './pages/gestion/Sync';
import Mensajes from './pages/gestion/Mensajes';

// Panel de administración
import AdminLayout from './pages/admin/AdminLayout';
import ApartamentosAdmin from './pages/admin/ApartamentosAdmin';
import Precios from './pages/admin/Precios';
import Cancelacion from './pages/admin/Cancelacion';
import Pagos from './pages/admin/Pagos';
import IcalAdmin from './pages/admin/IcalAdmin';
import Usuarios from './pages/admin/Usuarios';
import WebTextos from './pages/admin/WebTextos';

// Componentes
import CookieBanner from './components/CookieBanner';
import WhatsAppButton from './components/WhatsAppButton';
import { LangProvider } from './contexts/LangContext';

// Admin
import ExtrasAdmin from './pages/admin/ExtrasAdmin';
import OfertasAdmin from './pages/admin/OfertasAdmin';
import { DiscountProvider } from './contexts/DiscountContext';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import OffersBanner from './components/OffersBanner';

function MaintenanceGuard({ children }) {
  const [maintenance, setMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);
  const { pathname } = useLocation();

  useEffect(() => {
    async function check() {
      try {
        const settings = await fetchSettings();
        const isPreview = sessionStorage.getItem('maintenance_preview') === 'true';

        if (settings && settings.maintenance_mode === true && !isPreview) {
          setMaintenance(true);
        } else {
          setMaintenance(false);
        }
      } catch (err) {
        console.error('Error checking maintenance mode:', err);
      } finally {
        setLoading(false);
      }
    }

    // Solo chequear mantenimiento si NO estamos en admin o gestión
    const isAdmin = pathname.startsWith('/admin') || pathname.startsWith('/gestion') || pathname.startsWith('/login');
    if (!isAdmin) {
      check();
    } else {
      setLoading(false);
    }
  }, [pathname]);

  if (loading) return null; // O un spinner elegante
  if (maintenance) return <Maintenance />;
  return children;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

import PreviewBanner from './components/PreviewBanner';

export default function App() {
  return (
    <Elements stripe={stripePromise}>
      <AuthProvider>
        <LangProvider>
          <DiscountProvider>
            <BrowserRouter>
              <ScrollToTop />
              <OffersBanner />
              <MaintenanceGuard>
                <Routes>
                  {/* ─── WEB PÚBLICA ─────────────────────────────────── */}
                  <Route path="/" element={<Home />} />
                  <Route path="/apartamentos" element={<Apartments />} />
                  <Route path="/apartamentos/:slug" element={<ApartmentDetail />} />
                  <Route path="/nosotros" element={<About />} />
                  <Route path="/contacto" element={<Contact />} />
                  <Route path="/privacidad" element={<Privacy />} />
                  <Route path="/cookies" element={<Cookies />} />
                  <Route path="/terminos" element={<Terminos />} />
                  <Route path="/proteccion-datos" element={<ProteccionDatos />} />

                  <Route path="/login" element={<Login />} />

                  {/* ─── PANEL GESTIÓN (PROTEGIDO) ────────────────────── */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/gestion" element={<GestionLayout />}>
                      <Route index element={<Dashboard />} />
                      <Route path="reservas" element={<Reservas />} />
                      <Route path="calendario" element={<Calendario />} />
                      <Route path="sync" element={<Sync />} />
                      <Route path="mensajes" element={<Mensajes />} />
                    </Route>

                    {/* ─── PANEL ADMIN (PROTEGIDO) ──────────────────────── */}
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<ApartamentosAdmin />} />
                      <Route path="precios" element={<Precios />} />
                      <Route path="cancelacion" element={<Cancelacion />} />
                      <Route path="pagos" element={<Pagos />} />
                      <Route path="ical" element={<IcalAdmin />} />
                      <Route path="usuarios" element={<Usuarios />} />
                      <Route path="web" element={<WebTextos />} />
                      <Route path="ofertas" element={<OfertasAdmin />} />
                      <Route path="extras" element={<ExtrasAdmin />} />
                    </Route>
                  </Route>

                  {/* ─── FALLBACK ────────────────────────────────────── */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <PreviewBanner />
              </MaintenanceGuard>
              <WhatsAppButton />
              <CookieBanner />
            </BrowserRouter>
          </DiscountProvider>
        </LangProvider>
      </AuthProvider>
    </Elements>
  );
}
