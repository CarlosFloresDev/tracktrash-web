# Hallazgos del backend (para el equipo)

Revisión de `Luladusilva/TrackTrash` (rama `main`, commit `c51c3c9`, 24/11/2026), probada en producción:
web en https://tracktrash.pages.dev, API en https://tracktrash-backend.onrender.com y base de datos en Neon.

Prioridad: **A** antes de presentar, **B** conviene resolver, **C** mejora.

## Resuelto

- Login con JWT, refresh rotativo, logout y `GET /api/User/me`; permisos por rol en cada endpoint.
- Solicitudes con `details[]` en una sola llamada, materiales del recolector y postulaciones.
- Registro en un solo paso (`POST /api/Auth/Register`).
- Cancelar una solicitud cancela también su servicio activo.
- Vistas de indicadores en `05_indicator_views.sql` (ya no hay `500` en una base nueva).
- `GET /api/health`, `Dockerfile` y despliegue en Render.
- CORS limitado a `Cors__AllowedOrigins`.

## A. Antes de presentar

1. **Auto-deploy en Render.** El servicio usa el repositorio como público, sin la app de Render instalada en la cuenta
   dueña, así que no se entera de los push a `main`. Opciones: instalar la app de Render en el GitHub de la dueña del
   repositorio y darle acceso, o guardar el deploy hook de Render como secret del repositorio y llamarlo desde un workflow.
   Mientras tanto, cada cambio se despliega a mano.
2. **Verificar recolectores reales.** Ya hay una cuenta de administrador; los recolectores en revisión no pueden postular
   hasta que se verifiquen desde el panel web.

## B. Contrato y consistencia

3. **Reglas de negocio responden `401`.** Por ejemplo, "Only active, verified gatherers can apply." llega como
   `UnauthorizedAccessException` → `401`, el mismo código que una sesión inválida. Los clientes ya lo distinguen por el
   cuerpo, pero lo correcto es `403 Forbidden` para permisos y dejar `401` solo para autenticación.
4. **Puntos de acopio por material siempre vacíos.** `collection_point_residue_types` no tiene endpoint, así que
   `GET /api/CollectionPoint/residue-type/{id}` devuelve `[]`.
5. **Sin paginación ni filtros** en las listas (`?page=`, `?pageSize=`, `?status=`).
6. **Crear administradores** solo es posible editando la base de datos.

## C. Calidad

7. **Textos del historial y mensajes de error en inglés** (`"Gatherer application accepted."`,
   `"Email is already registered."`). Mejor códigos estables que el cliente traduzca.
8. **`UseHttpsRedirection()`** puede redirigir a un puerto inexistente en desarrollo con perfil solo-HTTP.
9. **Swagger solo en `Development`**: un `openapi.json` versionado ayudaría a los clientes.
