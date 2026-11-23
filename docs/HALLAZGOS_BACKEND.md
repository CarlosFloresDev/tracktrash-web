# Hallazgos del backend (para el equipo)

Revisión de `Luladusilva/TrackTrash` (rama `main`, commit `8a9ae5b`) hecha al integrar el web y la app móvil.
No se modificó nada del backend: todo se probó contra una copia local de solo lectura y una base PostgreSQL local.

Prioridad: **A** bloquea producción, **B** conviene resolver pronto, **C** mejora.

## A. Seguridad

1. **No existe inicio de sesión.** Hay `ITokenService` y `IPasswordHashingService`, pero ningún endpoint
   (`POST /api/Auth/login`) los usa. El web y la app identifican la cuenta solo por `GET /api/User/email/{email}`
   y **no pueden verificar la contraseña**. Ambos clientes ya están preparados: basta con implementar
   `AuthGateway` (web, `src/features/auth/gateway.ts`) y `AuthGateway` (móvil, `lib/features/session/`).
2. **Ningún endpoint exige autenticación.** `Program.cs` llama `UseAuthentication()` pero no registra
   `AddAuthentication().AddJwtBearer(...)` ni hay `[Authorize]`. Cualquiera puede listar usuarios (`GET /api/User`),
   cambiar roles (`PUT /api/User/{id}`) o desactivar cuentas.
3. **Autorización por recurso ausente.** El `userId`, `changedByUserId` y `assignedByUserId` los envía el cliente y
   el servidor los cree. Hay que tomarlos del token y validar que el recurso pertenece a quien lo pide.
4. **CORS abierto** (`AllowAnyOrigin`). Limitar a los orígenes del web al desplegar.
5. **`Jwt:Key` vacío rompe el arranque** y el README no lo menciona. Documentar `Jwt__Key` como variable de entorno.

## B. Contrato y consistencia

6. **Tablas puente sin endpoints:** `gatherer_residue_types` y `collection_point_residue_types` no se pueden llenar.
   Por eso `GET /api/Gatherer/available/residue-type/{id}` y `GET /api/CollectionPoint/residue-type/{id}`
   devuelven siempre `[]`.
7. **Cancelar una solicitud no cancela su servicio activo.** `PATCH CollectRequest/{id}/status` a `Cancelled`
   deja el `PickupService` en `Assigned`/`InProgress`. Los clientes lo resuelven cancelando primero el servicio, pero
   debería hacerlo el backend en una sola transacción.
8. **Crear una solicitud no es atómico.** Hay que llamar a `CollectRequest` y luego a `RequestDetail` una vez por
   material. Un `POST CollectRequest` que acepte `details[]` evitaría solicitudes vacías si falla una llamada.
9. **El registro tampoco es atómico:** `Location`, `User` y luego `Organization`/`Gatherer`. Si el correo ya existe,
   queda una `Location` huérfana. Un `POST /api/Auth/register` resolvería ambos problemas.
10. **Sin paginación ni filtros** en `GET` de listas (`CollectRequest`, `User`, `Location`, `RequestDetail`,
    `RecoveredMaterial`). Los clientes traen todo y cruzan en memoria. Faltan al menos `?status=`, `?page=`, `?pageSize=`.
11. **Faltan consultas útiles:** solicitudes por recolector con sus datos, y `GET /api/Gatherer/{id}` con el nombre
    del usuario, para no consultar `User` aparte.
12. **La comisión (`commissionPercentage`) la decide el cliente** al crear el servicio. Debería salir del plan de la
    organización o de una regla del servidor. Hoy los clientes usan 10 por defecto.

## C. Calidad

13. **Textos del historial en inglés** (`"Gatherer assigned."`, `"Pickup service InProgress."`) se muestran tal cual
    al usuario. Mejor devolver un código de evento y que el cliente lo traduzca.
14. **Mensajes de error en inglés** (`"Email is already registered."`). Los clientes muestran el mensaje recibido.
    Opciones: códigos de error estables (`EMAIL_TAKEN`) o `Accept-Language`.
15. **Las vistas SQL no están versionadas** (`vw_general_indicators`, `vw_residues_by_type`, `vw_gatherer_grades`).
    Sin ellas `/api/Indicator/*` falla en una base nueva. Hay una definición local en `local-dev/01_views.sql`
    que se puede tomar como base (ajustar a la lógica de negocio).
16. **`UseHttpsRedirection()` con perfil solo-HTTP** puede redirigir a un puerto inexistente en desarrollo.
17. **Falta `GET /api/health`** para el despliegue y para que las apps detecten si el servidor está arriba.
18. **Swagger solo en `Development`**: documentar el contrato en un `openapi.json` versionado ayudaría a los clientes.
