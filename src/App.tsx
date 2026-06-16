import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from './lib/stripe';
import { lazy, Suspense, useEffect, useState } from 'react';
import './index.css';
import Maintenance from './pages/Maintenance';

// Main pages — static import (critical LCP)
import Home from './pages/Home';
import Apartments from './pages/Apartments';
import ApartmentDetail from './pages/ApartmentDetail';

// Secondary pages — lazy (not primary traffic landing pages)
const Contact = lazy(() => import('./pages/Contact'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Cookies = lazy(() => import('./pages/Cookies'));
const Terms = lazy(() => import('./pages/Terms'));
const DataProtection = lazy(() => import('./pages/DataProtection'));
const BookingConfirmed = lazy(() => import('./pages/BookingConfirmed'));
const BookingPortal = lazy(() => import('./pages/BookingPortal'));
const Book = lazy(() => import('./pages/Book'));
const Faq = lazy(() => import('./pages/Faq'));
const Directions = lazy(() => import('./pages/Directions'));
const LeaveReview = lazy(() => import('./pages/LeaveReview'));
const Experiences = lazy(() => import('./pages/Experiences'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));

// Auth — lazy (rarely visited)
const Login = lazy(() => import('./pages/Login'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Portal de usuario — lazy
const PortalLayout = lazy(() => import('./pages/portal/PortalLayout'));
const PortalDashboard = lazy(() => import('./pages/portal/PortalDashboard'));
const PortalInvoices = lazy(() => import('./pages/portal/PortalInvoices'));
const PortalCheckin = lazy(() => import('./pages/portal/PortalCheckin'));

// Management panel — lazy
const ManagementLayout = lazy(() => import('./pages/management/ManagementLayout'));
const Dashboard = lazy(() => import('./pages/management/Dashboard'));
const Reservations = lazy(() => import('./pages/management/Reservations'));
const Calendar = lazy(() => import('./pages/management/Calendar'));
const Messages = lazy(() => import('./pages/management/Messages'));
const Tasks = lazy(() => import('./pages/management/Tasks'));

// Admin panel — lazy
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const ApartmentsAdmin = lazy(() => import('./pages/admin/ApartmentsAdmin'));
const Pricing = lazy(() => import('./pages/admin/Pricing'));
const GeneralSettings = lazy(() => import('./pages/admin/GeneralSettings'));
const Users = lazy(() => import('./pages/admin/Users'));
const BookingRules = lazy(() => import('./pages/admin/BookingRules'));
const Cancellation = lazy(() => import('./pages/admin/Cancellation'));
const Changelog = lazy(() => import('./pages/admin/Changelog'));
const WebContent = lazy(() => import('./pages/admin/WebContent'));
const ExtrasAdmin = lazy(() => import('./pages/admin/ExtrasAdmin'));
const ReviewsAdmin = lazy(() => import('./pages/admin/ReviewsAdmin'));
const OffersAdmin = lazy(() => import('./pages/admin/OffersAdmin'));
const FaqAdmin = lazy(() => import('./pages/admin/FaqAdmin'));
const Analytics = lazy(() => import('./pages/admin/Analytics'));
const IcalAdmin = lazy(() => import('./pages/admin/IcalAdmin'));
const CheckInAdmin = lazy(() => import('./pages/admin/CheckInAdmin'));
const EmailConfig = lazy(() => import('./pages/admin/EmailConfig'));
const DiscountCodes = lazy(() => import('./pages/admin/DiscountCodes'));
const AuditLog = lazy(() => import('./pages/admin/AuditLog'));
const PdfEditorAdmin = lazy(() => import('./pages/admin/PdfEditorAdmin'));
const ExperiencesAdmin = lazy(() => import('./pages/admin/ExperiencesAdmin'));
const BlogAdmin = lazy(() => import('./pages/admin/BlogAdmin'));

// Components
import CookieBanner from './components/CookieBanner';
import WhatsAppButton from './components/WhatsAppButton';
import { LangProvider } from './contexts/LangContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import { DiscountProvider } from './contexts/DiscountContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { registerPanelToast } from './utils/panelAction';
import OffersBanner from './components/OffersBanner';
import PreviewBanner from './components/PreviewBanner';

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal" />
    </div>
  );
}

class ChunkErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    const isChunkError =
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('Loading chunk') ||
      error.name === 'ChunkLoadError';
    return isChunkError ? { hasError: true } : null;
  }

  componentDidUpdate(_: unknown, prev: { hasError: boolean }) {
    if (this.state.hasError && !prev.hasError) {
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) return <PageLoader />;
    return this.props.children;
  }
}

function PanelRedirect() {
  const { user } = useAuth();
  const role = user?.app_metadata?.role;
  if (role === 'admin') return <Navigate to="/admin" replace />;
  if (role === 'gestion') return <Navigate to="/gestion" replace />;
  if (role === 'usuario') return <Navigate to="/portal" replace />;
  return <Navigate to="/login" replace />;
}

function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const { settings, loading: settingsLoading } = useSettings();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const { pathname } = useLocation();

  useEffect(() => {
    if (!settingsLoading) {
      setLoading(false);
    }
  }, [settingsLoading]);

  // Only check maintenance if NOT on admin or management paths
  const isProtectedPath =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/gestion') ||
    pathname.startsWith('/portal') ||
    pathname.startsWith('/login');
  const userRole = user?.app_metadata?.role;
  const isStaff = userRole === 'admin' || userRole === 'gestion';
  const isPreview = sessionStorage.getItem('maintenance_preview') === 'true' || isStaff;

  if (loading) return null;
  if (!isProtectedPath && settings?.maintenance_mode === true && !isPreview) {
    return <Maintenance />;
  }
  return children;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function ToastBridge() {
  const toast = useToast();
  useEffect(() => {
    registerPanelToast((msg, type) => {
      if (type === 'success') toast.success(msg);
      else toast.error(msg);
    });
  }, [toast]);
  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <Elements stripe={stripePromise}>
        <AuthProvider>
          <SettingsProvider>
            <LangProvider>
              <DiscountProvider>
                <CurrencyProvider>
                  <ToastProvider>
                    <ToastBridge />
                    <BrowserRouter>
                      <ScrollToTop />
                      <OffersBanner />
                      <MaintenanceGuard>
                        <ChunkErrorBoundary>
                        <Suspense fallback={<PageLoader />}>
                          <Routes>
                            {/* ─── PUBLIC WEB ─────────────────────────────────── */}
                            <Route path="/" element={<Home />} />
                            <Route path="/apartamentos" element={<Apartments />} />
                            <Route path="/apartamentos/:slug" element={<ApartmentDetail />} />
                            <Route path="/experiencias" element={<Experiences />} />
                            <Route path="/contacto" element={<Contact />} />
                            <Route path="/privacidad" element={<Privacy />} />
                            <Route path="/cookies" element={<Cookies />} />
                            <Route path="/terminos" element={<Terms />} />
                            <Route path="/proteccion-datos" element={<DataProtection />} />
                            <Route path="/reserva-confirmada/:id" element={<BookingConfirmed />} />
                            <Route path="/mi-reserva" element={<BookingPortal />} />
                            <Route path="/reservar" element={<Book />} />
                            <Route path="/faq" element={<Faq />} />
                            <Route path="/como-llegar" element={<Directions />} />
                            <Route path="/dejar-resena" element={<LeaveReview />} />
                            <Route path="/blog" element={<Blog />} />
                            <Route path="/blog/:slug" element={<BlogPost />} />

                            <Route path="/panel" element={<PanelRedirect />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/reset-password" element={<ResetPassword />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />

                            {/* ─── PORTAL DE USUARIO (PROTECTED) ──────────────── */}
                            <Route element={<ProtectedRoute requiredRole="usuario" />}>
                              <Route path="/portal" element={<PortalLayout />}>
                                <Route index element={<PortalDashboard />} />

                                {/* Portal personal */}
                                <Route path="checkin"  element={<PortalCheckin />} />
                                <Route path="facturas" element={<PortalInvoices />} />

                                {/* Secciones de Gestión */}
                                <Route path="g/dashboard"  element={<Dashboard />} />
                                <Route path="g/reservas"   element={<Reservations />} />
                                <Route path="g/calendario" element={<Calendar />} />
                                <Route path="g/mensajes"   element={<Messages />} />
                                <Route path="g/tareas"     element={<Tasks />} />

                                {/* Secciones de Admin — Contenido */}
                                <Route path="a/apartamentos"  element={<ApartmentsAdmin />} />
                                <Route path="a/ofertas"       element={<OffersAdmin />} />
                                <Route path="a/extras"        element={<ExtrasAdmin />} />
                                <Route path="a/resenas"       element={<ReviewsAdmin />} />
                                <Route path="a/faq"           element={<FaqAdmin />} />
                                <Route path="a/blog"          element={<BlogAdmin />} />
                                <Route path="a/experiencias"  element={<ExperiencesAdmin />} />
                                <Route path="a/web"           element={<WebContent />} />

                                {/* Secciones de Admin — Configuración */}
                                <Route path="a/precios"       element={<Pricing />} />
                                <Route path="a/descuentos"    element={<DiscountCodes />} />
                                <Route path="a/reglas"        element={<BookingRules />} />
                                <Route path="a/cancelacion"   element={<Cancellation />} />
                                <Route path="a/emails"        element={<EmailConfig />} />
                                <Route path="a/ical"          element={<IcalAdmin />} />
                                <Route path="a/registro"      element={<CheckInAdmin />} />
                                <Route path="a/pdf-editor"    element={<PdfEditorAdmin />} />
                                <Route path="a/configuracion" element={<GeneralSettings />} />

                                {/* Secciones de Admin — Sistema */}
                                <Route path="a/analytics"     element={<Analytics />} />
                                <Route path="a/auditoria"     element={<AuditLog />} />
                                <Route path="a/changelog"     element={<Changelog />} />
                              </Route>
                            </Route>

                            {/* ─── MANAGEMENT PANEL (PROTECTED) ────────────────── */}
                            <Route element={<ProtectedRoute requiredRole="gestion" />}>
                              <Route path="/gestion" element={<ManagementLayout />}>
                                <Route index element={<Dashboard />} />
                                <Route path="reservas" element={<Reservations />} />
                                <Route path="calendario" element={<Calendar />} />
                                <Route path="mensajes" element={<Messages />} />
                                <Route path="tareas" element={<Tasks />} />
                              </Route>
                            </Route>

                            {/* ─── ADMIN PANEL (PROTECTED) ──────────────────────── */}
                            <Route element={<ProtectedRoute requiredRole="admin" />}>
                              <Route path="/admin" element={<AdminLayout />}>
                                <Route index element={<ApartmentsAdmin />} />
                                <Route path="precios" element={<Pricing />} />
                                <Route path="configuracion" element={<GeneralSettings />} />
                                <Route path="usuarios" element={<Users />} />
                                <Route path="ofertas" element={<OffersAdmin />} />
                                <Route path="extras" element={<ExtrasAdmin />} />
                                <Route path="reglas" element={<BookingRules />} />
                                <Route path="resenas" element={<ReviewsAdmin />} />
                                <Route path="cancelacion" element={<Cancellation />} />
                                <Route path="changelog" element={<Changelog />} />
                                <Route path="web" element={<WebContent />} />
                                <Route path="faq" element={<FaqAdmin />} />
                                <Route path="analytics" element={<Analytics />} />
                                <Route path="ical" element={<IcalAdmin />} />
                                <Route path="registro" element={<CheckInAdmin />} />
                                <Route path="emails" element={<EmailConfig />} />
                                <Route path="descuentos" element={<DiscountCodes />} />
                                <Route path="auditoria" element={<AuditLog />} />
                                <Route path="pdf-editor" element={<PdfEditorAdmin />} />
                                <Route path="experiencias" element={<ExperiencesAdmin />} />
                                <Route path="blog" element={<BlogAdmin />} />
                              </Route>
                            </Route>

                            {/* ─── FALLBACK ────────────────────────────────────── */}
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </Suspense>
                        </ChunkErrorBoundary>
                        <PreviewBanner />
                      </MaintenanceGuard>
                      <WhatsAppButton />
                      <CookieBanner />
                    </BrowserRouter>
                  </ToastProvider>
                </CurrencyProvider>
              </DiscountProvider>
            </LangProvider>
          </SettingsProvider>
        </AuthProvider>
      </Elements>
    </ThemeProvider>
  );
}
