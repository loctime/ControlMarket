# ControlMarket Backend

Backend Node.js que usa el Admin SDK de Firebase para:
- Registrar nuevas organizaciones (auto-registro público).
- Gestionar colaboradores dentro de una organización (admin-only).
- Setear custom claims (`orgId`, `role`) que consumen las Firestore rules.

## Setup local

```bash
cd backend
npm install
cp .env.example .env
# Completar FIREBASE_SERVICE_ACCOUNT_JSON con el JSON del service account (en una sola línea).
npm run dev
```

El servidor arranca en `http://localhost:3001`.

## Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/health` | público | healthcheck |
| POST | `/api/register` | público | crea org + admin |
| GET | `/api/team` | admin | lista colaboradores de la org |
| POST | `/api/team` | admin | crea colaborador |
| PATCH | `/api/team/:uid` | admin | cambia role/active/displayName |
| DELETE | `/api/team/:uid` | admin | desactiva colaborador |

Auth: header `Authorization: Bearer <idToken>` (Firebase ID token).

## Deploy

### Vercel
```bash
vercel --prod
```
Configurar variables: `FIREBASE_SERVICE_ACCOUNT_JSON`, `ALLOWED_ORIGIN`.

### Render
`render.yaml` ya definido. Crear servicio desde el repo apuntando a `backend/`.
Configurar las mismas variables de entorno desde el dashboard.
