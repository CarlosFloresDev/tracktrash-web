# Hallazgos del backend (para el equipo)

Revisión de `Luladusilva/TrackTrash` (rama `main`, commit `525a417`, 24/11/2026) hecha al integrar el web y la app móvil.
No se modificó nada del backend: todo se probó contra una copia local de solo lectura y una base PostgreSQL local
creada con `01_schema.sql`, `03_add_auth_and_applications.sql` y `04_seed_residue_types.sql`.

Prioridad: **A** bloquea producción, **B** conviene resolver pronto, **C** mejora.

## Resuelto desde la revisión anterior (commit `8a9ae5b`)

- Inicio de sesión con JWT (`Auth/Login`, `Refresh` con rotación, `Logout`) y `GET /api/User/me`.
- Autenticación exigida por defecto y permisos por rol en cada endpoint; los ids de usuario salen del token.
- `POST /api/CollectRequest` acepta `details[]`: la solicitud se crea con sus materiales en una sola llamada.
- Materiales del recolector (`PUT /api/Gatherer/me/residue-types`) y recolectores compatibles por solicitud.
- Postulaciones: el recolector se postula y el solicitante acepta o rechaza. La comisión la fija el servidor.
- `Jwt:Key` documentado en el README (user-secrets).

Los tests del backend pasan (9/9).

## A. Antes de producción

1. **Los indicadores fallan en una base nueva.** `GET /api/Indicator/general` responde `500`: las vistas
   `vw_general_indicators`, `vw_residues_by_type` y `vw_gatherer_grades` solo están en `02_align_neon_api.sql`,
   que el README no incluye en el orden de instalación y que además se niega a correr si ya hay datos.
   Sugerencia: mover las vistas a un script propio (por ejemplo `05_indicator_views.sql`) y listarlo en el README.
2. **Cancelar una solicitud no cancela su servicio.** Probado: con un recolector asignado, el dueño hace
   `PATCH /api/CollectRequest/{id}/status` a `Cancelled`, responde `200` y la solicitud queda `Cancelled`,
   pero el `PickupService` sigue en `Assigned` y el recolector lo sigue viendo. Debería cancelarse en la misma transacción
   (o rechazar la cancelación mientras haya un servicio activo).
3. **CORS abierto** (`AllowAnyOrigin`). Limitar a los orígenes del web al desplegar.
4. **Despliegue pendiente.** Sin una URL pública, la app móvil solo funciona en la misma red que la API.

## B. Contrato y consistencia

5. **Puntos de acopio por material siempre vacíos.** `collection_point_residue_types` no tiene endpoint, así que
   `GET /api/CollectionPoint/residue-type/{id}` devuelve `[]`.
6. **El registro no es atómico.** `POST /api/User` (anónimo), luego login, `Location`, `PUT User` y el perfil
   `Organization`/`Gatherer`. Si falla un paso queda una cuenta a medias. Un `POST /api/Auth/register` lo resolvería.
7. **Sin paginación ni filtros** en las listas (`GET /api/CollectRequest?page=1&pageSize=1` devuelve todo).

## C. Calidad

8. **Textos del historial en inglés** (`"Gatherer application accepted."`) que los clientes muestran tal cual.
   Mejor devolver un código de evento y que el cliente lo traduzca.
9. **Mensajes de error en inglés** (`"Email is already registered."`). Opciones: códigos estables (`EMAIL_TAKEN`)
   o `Accept-Language`.
10. **`UseHttpsRedirection()` con perfil solo-HTTP** puede redirigir a un puerto inexistente en desarrollo.
11. **Falta `GET /api/health`** (hoy responde `401`) para el despliegue y para que las apps detecten si el servidor está arriba.
12. **Swagger solo en `Development`**: un `openapi.json` versionado ayudaría a los clientes.
