# Illa Pancha — Web de Apartamentos Turísticos

Aplicación web completa y profesional para la gestión y reserva de apartamentos turísticos en Ribadeo (Galicia). Refactorizada a **TypeScript** para máxima robustez, con soporte multi-idioma (5), multi-moneda (2) y un ecosistema de **13 Edge Functions** en Supabase.

---

## 🚀 Tecnologías Core

- **Frontend:** React 18 + **TypeScript** + Vite 6
- **Base de datos / Backend:** Supabase (PostgreSQL + RLS + 13 Edge Functions)
- **Testing E2E:** **Playwright** (Chromium)
- **Pagos:** Stripe (PaymentIntents API)
- **Email:** Resend (Infraestructura de notificaciones)
- **Estilos:** Tailwind CSS + Vanilla CSS (Aesthetics Premium)
- **Excel:** **ExcelJS** (Exportación avanzada con estilos) + Google Sheets API (Analytics)

---

## 📂 Estructura del Proyecto

```
src/
├── types.ts                   # Centralización de interfaces TypeScript
├── pages/
│   ├── admin/                 # Panel Administración (Analytics, FAQ, Apartamentos...)
│   ├── gestion/               # Panel Gestión (Reservas, Calendario denso, Dashboard...)
│   └── (públicas)/            # Home, Apartamentos, Facturas, Contacto, i18n
├── components/
│   ├── BookingWidget.tsx      # Widget de búsqueda dinámico
│   ├── MiniCalendar.tsx       # Calendario de disponibilidad interactivo
│   └── BookingModal.tsx       # Checkout en 4 pasos (Stripe integrado)
├── contexts/
│   ├── CurrencyContext.tsx    # Toggle EUR/GBP
│   ├── AuthContext.tsx        # Roles Admin/Gestor/User
│   └── i18n/                  # Soporte ES, EN, FR, DE, PT
├── services/
│   ├── supabaseService.ts     # CRUD tipado
│   └── dataService.ts         # Normalización camelCase/snake_case
└── tests/e2e/                 # Suite de Playwright (Public, Admin, Gestion)
```

---

## 🌐 Funcionalidades Destacadas

- **Multilingüe Automático:** Soporte para ES, EN, FR, DE y PT con integración opcional de **DeepL API** para auto-traducción en el panel admin.
- **Precios Dinámicos (D3):** Modificadores automáticos por antelación, ocupación del mes y franja horaria.
- **Dashboard de Analíticas:** Gráficas con `recharts` y exportación profesional a **Google Sheets** y Excel local estilizado.
- **Sincronización iCal:** Exportación e importación de calendarios (Booking/Airbnb) vía Edge Functions.
- **Reseñas Verificadas:** Flujo post-estancia automático pidiendo opinión en Google y web interna tras el checkout.
- **PWA Ready:** Service Worker para notificaciones Push y funcionamiento offline básico.

---

## 🛠️ Configuración y Despliegue

### Variables de Entorno (.env)
```env
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
VITE_STRIPE_PUBLIC_KEY=...
# Credenciales para los robots de Test
TEST_ADMIN_EMAIL=...
TEST_ADMIN_PASSWORD=...
```

### Comandos Útiles
```bash
npm install        # Instalación de dependencias tipadas
npm run dev        # Modo desarrollo (Vite)
npm run test:e2e   # Lanzar robots de Playwright
npm run build      # Compilación TS -> JS (Dist)
```

### Supabase Edge Functions (Capa Lógica)
Las 13 funciones se encuentran en `supabase/functions/`. Desplegar individualmente con:
`npx supabase functions deploy {nombre_funcion} --no-verify-jwt`

---

## ⚖️ Licencia

Proyecto privado de **Illa Pancha**. Prohibida su distribución sin consentimiento.
