# ControlMarket

PWA multi-tenant de gestión para kioscos y comercios chicos: punto de venta, stock, categorías, ventas con rol admin/vendedor, e importación masiva de productos desde Excel/CSV. Cada organización tiene sus propios datos; un admin registra su empresa y luego invita colaboradores.

Frontend en React + Vite. Backend en **Vercel serverless functions** (mismo repo, sin CORS ni URL extra). Autenticación, datos y reglas en Firebase (Auth + Firestore).

## Stack

- **Frontend**: React 19, Vite 8, React Router 7, Tailwind CSS, vite-plugin-pwa (offline + install), Recharts, @zxing (scanner de códigos de barra), xlsx (import/export).
- **Backend**: Vercel serverless functions (Node 20) con `firebase-admin` y `zod`.
- **Datos/Auth**: Firebase Auth (Email/Password), Firestore, Custom Claims (`orgId`, `role`).
- **Deploy**: Vercel (único proyecto; el frontend se build-ea a `dist/`, las funciones viven en `api/`).

## Arquitectura multi-tenant

- Cada empresa es una `organizations/{orgId}`. Todos los documentos de negocio (`products`, `categories`, `sales`, `users`) llevan `orgId`.
- El **backend** crea usuarios de Auth y setea **Custom Claims** `{ orgId, role }`. El cliente nunca escribe `users/` ni `organizations/` directamente.
- Las **Firestore rules** autorizan en base a esos claims (`request.auth.token.orgId`), sin necesidad de `get()` extra → performance.
- Los **dos roles** son `admin` (acceso total dentro de su org) y `vendedor` (solo registra ventas y ve las propias).

## Estructura del repo

```
.
├── api/                          ← Vercel serverless functions
│   ├── _lib/
│   │   ├── firebaseAdmin.js      ← init lazy del Admin SDK
│   │   └── auth.js               ← helpers requireAuth / requireAdmin
│   ├── health.js                 ← GET  /api/health
│   ├── register.js               ← POST /api/register  (público)
│   ├── team.js                   ← GET/POST /api/team  (admin)
│   └── team/[uid].js             ← PATCH/DELETE /api/team/:uid  (admin)
├── src/
│   ├── pages/                    ← LoginPage, RegisterPage, DashboardPage,
│   │                               ProductsPage, ProductDetailPage,
│   │                               SalesPage, SaleHistoryPage, TeamPage
│   ├── components/               ← auth, layout, sales, products, dashboard, ui
│   ├── hooks/                    ← useAuth, useProducts, useSales, useCart,
│   │                               useOnlineStatus, useSync
│   ├── contexts/                 ← AuthContext, SyncContext
│   ├── lib/
│   │   ├── firebase.js           ← init Web SDK (cliente)
│   │   ├── firestore.js          ← queries + writes (todas scoped por orgId)
│   │   └── api.js                ← cliente HTTP del backend (usa ID token)
│   ├── router/AppRouter.jsx
│   └── utils/
├── scripts/
│   └── migrate-to-multitenant.mjs   ← migración one-shot de datos legacy
├── firestore.rules               ← rules basadas en custom claims
├── firebase.json                 ← deploy de rules + emuladores locales
├── vercel.json                   ← config Vite + rewrites (excluye /api/)
├── .env.example
└── package.json
```

## Setup local

### Requisitos
- Node.js ≥ 20
- Una cuenta de Firebase con Auth (Email/Password) y Firestore habilitados

### 1. Instalar dependencias
```bash
npm install --legacy-peer-deps
```
(El flag es por el peer dep de `vite-plugin-pwa` sobre Vite 8 — ya hay un `.npmrc` en el repo.)

### 2. Variables de entorno
```bash
cp .env.example .env
```
Completá con los valores de Firebase (Web SDK config del proyecto).

Para que funcionen las serverless functions en local, agregá también:
```
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"-----BEGIN..."}
```
Este valor es el JSON completo del service account, en una sola línea. Se obtiene en **Firebase Console → Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada**.

### 3. Frontend
```bash
npm run dev          # http://localhost:5173
```

### 4. Serverless functions (opcional en dev)
Para ejecutar `api/*` localmente necesitás Vercel CLI:
```bash
npm i -g vercel
vercel dev           # sirve frontend + /api/* juntos
```
Si no usás `vercel dev`, las páginas que llamen al backend (`/registro`, `/equipo`) no van a funcionar en local — pero el resto del frontend sí.

## Deploy a Vercel

1. Conectá el repo a Vercel (framework auto-detectado: Vite).
2. En **Project Settings → Environment Variables**, agregá:

   | Variable | Valor |
   |---|---|
   | `FIREBASE_SERVICE_ACCOUNT_JSON` | JSON del service account (pegá el archivo tal cual, Vercel soporta multi-línea) |

   Las `VITE_FIREBASE_*` del frontend ya deberían estar configuradas del deploy original.

3. Deploy. Vercel detecta `api/*` como serverless functions automáticamente y aplica el rewrite SPA del `vercel.json` al resto.

### Deploy de Firestore rules
```bash
npm i -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

### Verificación post-deploy
1. `GET https://<tu-dominio>/api/health` → `{"ok":true}`
2. Registrate en `/registro` → debe redirigir a `/dashboard`.
3. Probá con una segunda org en incógnito → los productos de una org no se ven en la otra.

## API

Todos los endpoints aceptan/devuelven JSON. Los protegidos requieren header `Authorization: Bearer <idToken>` (Firebase ID token del cliente).

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/health` | público | Healthcheck |
| `POST` | `/api/register` | público | Crea organización + user admin |
| `GET` | `/api/team` | admin | Lista usuarios de la org |
| `POST` | `/api/team` | admin | Crea colaborador |
| `PATCH` | `/api/team/:uid` | admin | Cambia role / active / displayName |
| `DELETE` | `/api/team/:uid` | admin | Desactiva colaborador (revoca tokens) |

### POST /api/register
```json
{
  "nombreEmpresa": "Kiosco Martín",
  "email": "admin@kiosco.com",
  "password": "secreto123",
  "displayName": "Martín"
}
```
Response 201: `{ uid, orgId }`. Efectos: crea `organizations/{orgId}`, `users/{uid}` con `role: 'admin'`, y setea custom claims.

### POST /api/team
```json
{ "email": "vendedor1@kiosco.com", "password": "tmp1234", "role": "vendedor" }
```

## Modelo de datos

```
organizations/{orgId}
  ├── name, ownerUid, plan, active, createdAt

users/{uid}
  ├── uid, orgId, email, displayName, role ('admin'|'vendedor'), active, createdAt

products/{id}
  ├── orgId, name, price, costPrice, stock, category, barcode, unit, active, ...

categories/{id}
  ├── orgId, name, order, active

sales/{id}
  ├── orgId, vendedorId, vendedorName, items[], total, profit,
      paymentMethod, status, dateKey, createdAt
```

## Reglas y aislamiento

Ver `firestore.rules`. Resumen:

- Todo lo que no sea `organizations`/`users` permite read si `orgId` del doc == claim del token.
- `users` y `organizations` solo se escriben desde el backend (Admin SDK salta rules).
- `products` / `categories`: escritura solo admin.
- `sales`: admin ve todas las de su org; vendedor ve solo las propias; create requiere que `vendedorId == auth.uid`.

## Migrar datos legacy (mono-tenant → multi-tenant)

Si ya tenías datos antes de multi-tenancy, corré una vez:

```bash
FIREBASE_SERVICE_ACCOUNT_JSON='...' \
LEGACY_OWNER_UID='uid-del-admin-original' \
LEGACY_ORG_NAME='Mi Negocio' \
node scripts/migrate-to-multitenant.mjs
```

Qué hace:
1. Crea una `organizations/{orgId}` para los datos existentes.
2. Agrega `orgId` a todos los docs de `users`, `products`, `categories`, `sales` que no lo tengan.
3. Setea custom claims a todos los usuarios.

Después, los usuarios deben **volver a loguearse** para que los claims surtan efecto.

## Scripts npm

| Script | Qué hace |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Build de producción a `dist/` |
| `npm run preview` | Preview del build |
| `npm run lint` | ESLint |

## Troubleshooting

**`500 Internal Server Error` en `/api/register`**
- Abrí DevTools → Network → Response: el handler devuelve `{ error: "..." }` con el detalle.
- Causas frecuentes:
  - `FIREBASE_SERVICE_ACCOUNT_JSON` no seteada o JSON inválido.
  - Firestore no está creado en el proyecto Firebase.
  - Email/Password Auth deshabilitado en Firebase Console → Authentication.

**`Permission denied` en Firestore desde el cliente**
- Los custom claims se propagan solo al renovar el token. Después de registro o cambio de rol, el frontend llama `getIdToken(true)`; si lo hiciste por script, cerrá sesión y volvé a entrar.

**Build falla con ERESOLVE por `vite-plugin-pwa`**
- El `.npmrc` del repo tiene `legacy-peer-deps=true`. Si clonaste antes de ese commit, re-clonado o correr `npm install --legacy-peer-deps`.

**El SPA no muestra la ruta refresheada**
- `vercel.json` hace rewrite de todo lo que no empiece con `/api/` a `/index.html`. Si agregaste un nuevo dominio, verificá que apunte al mismo deploy.
