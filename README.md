# Illa Pancha — Web de Apartamentos Turísticos

Aplicación web completa para la gestión y reserva de apartamentos turísticos en Ribadeo (Galicia). Incluye web pública bilingüe (ES/EN), panel de administración, panel de gestión de reservas e integración con Supabase y Stripe.

---

## Tecnologías

- **Frontend:** React 18 + Vite 6
- **Base de datos / Backend:** Supabase (PostgreSQL + Edge Functions)
- **Pagos:** Stripe
- **Email:** Resend (dominio: info@apartamentosillapancha.com)
- **Estilos:** Tailwind CSS + `src/index.css` (overrides, dark mode, responsive)
- **Routing:** React Router DOM v7
- **Otros:** jsPDF (facturas), xlsx (exportación Excel), React Datepicker

---

## Estructura del proyecto

```
src/
├── pages/
│   ├── Home.jsx               # Página de inicio
│   ├── Apartments.jsx         # Listado de apartamentos
│   ├── ApartmentDetail.jsx    # Detalle + reserva
│   ├── About.jsx              # Nosotros / Ribadeo
│   ├── Contact.jsx            # Formulario de contacto
│   ├── Reservar.jsx           # Página de reserva directa
│   ├── ReservaConfirmada.jsx  # Confirmación post-pago
│   ├── PortalReserva.jsx      # Portal del huésped (mi-reserva)
│   ├── Maintenance.jsx        # Pantalla de mantenimiento
│   ├── Login.jsx              # Autenticación
│   ├── ResetPassword.jsx      # Recuperar contraseña
│   ├── admin/                 # Panel de administración
│   │   ├── ApartamentosAdmin.jsx
│   │   ├── Precios.jsx
│   │   ├── OfertasAdmin.jsx
│   │   ├── ExtrasAdmin.jsx
│   │   ├── ReglasReserva.jsx  # Mínimos de estancia por fechas
│   │   ├── ResenasAdmin.jsx
│   │   ├── Cancelacion.jsx
│   │   ├── Pagos.jsx
│   │   ├── ConfiguracionGeneral.jsx
│   │   ├── Usuarios.jsx
│   │   └── Changelog.jsx
│   └── gestion/               # Panel de gestión diaria
│       ├── Dashboard.jsx
│       ├── Reservas.jsx
│       ├── Calendario.jsx
│       └── Mensajes.jsx
├── components/
│   ├── Navbar.jsx             # Logo + dark mode toggle + hamburger
│   ├── Footer.jsx
│   ├── BookingModal.jsx       # Modal reserva (4 pasos)
│   ├── ManualBookingModal.jsx # Reserva manual desde admin
│   ├── OffersBanner.jsx
│   ├── PreviewBanner.jsx
│   ├── CookieBanner.jsx
│   └── WhatsAppButton.jsx
├── contexts/
│   ├── AuthContext.jsx
│   ├── LangContext.jsx        # Idioma ES/EN
│   ├── SettingsContext.jsx    # Configuración de Supabase
│   ├── ThemeContext.jsx       # Dark mode (localStorage + prefers-color-scheme)
│   └── DiscountContext.jsx
├── services/
│   ├── supabaseService.js     # Todas las operaciones de BD
│   └── dataService.js        # Normalización de datos (snake_case → camelCase)
├── i18n/
│   ├── translations.js        # Hook useT()
│   └── locales/
│       ├── es.json            # Textos en español
│       └── en.json            # Textos en inglés
└── lib/
    ├── supabase.js
    └── stripe.js
```

---

## Rutas

### Públicas
| Ruta | Descripción |
|------|-------------|
| `/` | Inicio |
| `/apartamentos` | Listado de apartamentos |
| `/apartamentos/:slug` | Detalle y reserva |
| `/nosotros` | Sobre nosotros + la zona |
| `/contacto` | Formulario de contacto |
| `/reservar` | Página de reserva directa (modo redirect) |
| `/mi-reserva` | Portal del huésped |
| `/reserva-confirmada/:id` | Confirmación de reserva |
| `/privacidad` | Política de privacidad |
| `/cookies` | Política de cookies |
| `/terminos` | Términos y condiciones |
| `/proteccion-datos` | Protección de datos |
| `/login` | Acceso al panel |
| `/reset-password` | Recuperar contraseña |

### Panel de gestión (protegido)
| Ruta | Descripción |
|------|-------------|
| `/gestion` | Dashboard |
| `/gestion/reservas` | Gestión de reservas |
| `/gestion/calendario` | Vista de calendario |
| `/gestion/mensajes` | Mensajes de contacto |

### Panel de administración (protegido)
| Ruta | Descripción |
|------|-------------|
| `/admin` | Gestión de apartamentos y fotos |
| `/admin/precios` | Precios y temporadas |
| `/admin/ofertas` | Ofertas y descuentos |
| `/admin/extras` | Servicios adicionales |
| `/admin/reglas` | Reglas de estancia mínima |
| `/admin/resenas` | Reseñas |
| `/admin/cancelacion` | Política de cancelación |
| `/admin/pagos` | Configuración de pagos |
| `/admin/configuracion` | Configuración general |
| `/admin/usuarios` | Usuarios |
| `/admin/changelog` | Historial de versiones |

---

## Variables de entorno

Archivo `.env` en la raíz:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
VITE_STRIPE_PUBLIC_KEY=pk_live_...
VITE_SITE_URL=https://apartamentosillapancha.com
VITE_WHATSAPP_PHONE=34XXXXXXXXX
```

Las claves secretas (`STRIPE_SECRET_KEY`, `RESEND_API_KEY`) van en los **Secrets de Supabase Edge Functions**, no en el `.env`.

---

## Base de datos (Supabase)

Proyecto: `wzjonvdauwaispnjosaw`

| Tabla | Descripción |
|-------|-------------|
| `apartments` | Apartamentos con descripción bilingüe, precios y comodidades |
| `season_prices` | Precios por temporada por apartamento |
| `apartment_photos` | Fotos (storage_path → Supabase Storage, o photo_url externa) |
| `reservations` | Reservas con estado, pagos y extras |
| `extras` | Servicios adicionales disponibles |
| `offers` | Descuentos por código o porcentaje |
| `messages` | Mensajes del formulario de contacto |
| `reviews` | Reseñas por apartamento |
| `site_settings` | Configuración general del sitio (clave-valor) |
| `site_pages` | Páginas legales |
| `min_stay_rules` | Reglas de estancia mínima por fechas |
| `changelog` | Historial de versiones |

### Storage
- Bucket `apartment-photos` (público)
- Ruta de archivos: `{slug}/{timestamp}_{random}.{ext}`

---

## Instalación y desarrollo

```bash
npm install
npm run dev        # Servidor local en http://localhost:5173
npm run build      # Build de producción → dist/
npm run preview    # Vista previa del build
```

---

## Funcionalidades principales

- **Bilingüe ES/EN** — cambio de idioma en tiempo real, textos en `src/i18n/locales/`
- **Dark mode** — toggle en navbar, persiste en localStorage, respeta `prefers-color-scheme`
- **Modo mantenimiento** — activable desde `/admin/configuracion` con vista previa
- **Dos modos de reserva**: modal (BookingModal 4 pasos) o página `/reservar` (redirect)
- **Pago con Stripe** — señal o total, integrado en BookingModal
- **Calendario de disponibilidad** por apartamento
- **Precios de temporada** (baja, alta, Navidad, Semana Santa)
- **Sistema de ofertas** con códigos de descuento
- **Emails automáticos** de confirmación vía Resend (Edge Functions)
- **Exportación** de reservas a Excel y facturas PDF
- **SEO** con meta tags dinámicos por página
- **Portal del huésped** en `/mi-reserva`

---

## Despliegue (Netlify)

El proyecto usa `netlify.toml` para el build y los redirects SPA.

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Variables de entorno en Netlify → Site settings → Environment variables.

### Edge Functions (Supabase)
```
supabase/functions/
├── process-payment/
├── send-reservation-email/
├── send-owner-notification/
└── send-contact-reply/
```
Secrets necesarios en Supabase: `STRIPE_SECRET_KEY`, `RESEND_API_KEY`.

---

## Licencia

Proyecto privado — todos los derechos reservados.
