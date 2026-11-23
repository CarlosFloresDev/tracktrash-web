# TrackTrash Web

Aplicación web de TrackTrash: sitio público, panel por rol (hogar, organización, recolector y administrador) y
gestión del catálogo. Consume la API de `Luladusilva/TrackTrash` (ASP.NET Core, PostgreSQL).

## Stack

React 19, TypeScript, Vite, Tailwind CSS 4, React Router, TanStack Query, React Hook Form + Zod, Recharts y Leaflet.

## Estructura

```
src/
  api/          contrato del backend: enums, esquemas Zod, endpoints tipados y hooks de TanStack Query
  app/          router y proveedores
  components/   brand (logo, íconos SVG, ilustraciones), layout, ui (primitivos), map
  features/     auth (gateway reemplazable) y requests (listas y cruces de datos)
  lib/          cliente HTTP, formato es-PE, variables de entorno
  pages/        public/ y app/ (una página por pantalla, cargadas con lazy)
local-dev/      vistas SQL locales, datos de ejemplo y scripts para base local
docs/           HALLAZGOS_BACKEND.md: lo que debe corregir el equipo del backend
```

Decisiones:

* Las respuestas se validan con Zod: si el backend cambia el contrato, el error es claro y temprano.
* `AuthGateway` aísla el acceso. Hoy el backend no valida contraseñas (ver `docs/HALLAZGOS_BACKEND.md`),
  así que la implementación provisional identifica la cuenta por correo y la interfaz lo avisa.
* Las transiciones de estado replican `CollectRequestStatusRules` del backend para ofrecer solo acciones válidas.

## Ejecutar en local

Requisitos: Node 22+, .NET SDK 10 y PostgreSQL 15+ (se usa uno portátil en `D:\DevTools\postgres`).

```bash
# 1. Base de datos y datos de ejemplo
local-dev/start-db.cmd
psql -h localhost -p 54329 -U postgres -c "create database tracktrash_db"
psql -h localhost -p 54329 -U postgres -d tracktrash_db -f <backend>/database/01_schema.sql
psql -h localhost -p 54329 -U postgres -d tracktrash_db -f local-dev/01_views.sql

# 2. API (copia de solo lectura del backend, sin tocar su repositorio)
local-dev/run-api.cmd            # http://localhost:5145
node local-dev/seed.mjs          # cuentas de ejemplo, contraseña TrackTrash2026!

# 3. Web
cp .env.example .env.local
npm install
npm run dev
```

Cuentas de ejemplo: `admin@tracktrash.pe`, `lucia@correo.pe` (hogar), `picanteria@correo.pe` (organización),
`elmer@recicla.pe` (recolector verificado), `sofia@recicla.pe` (recolector en revisión).

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Comprueba tipos y genera `dist/` |
| `npm run lint` | ESLint |
| `npm test` | Pruebas con Vitest |
