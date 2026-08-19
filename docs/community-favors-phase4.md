# FASE 4: Favores por activeProfile y Activación de Colaborador en AppuraPe

**Fecha:** 2026-08-18  
**Proyecto:** AppuraPe / IquitosDelivery  
**Tecnologías:** .NET 9 Clean Architecture (Backend) + Angular 21 (Frontend)

---

## 1. Resumen de lo Implementado

Se reorganizó integralmente el módulo de **Favores / Community** para operar de forma estricta según el `activeProfile` de la sesión:

- **Modo Cliente (`activeProfile = Customer`):**
  - Vista *"Mis favores"* donde el cliente publica encargos y revisa sus solicitudes propias (`view=my`).
  - Filtros: `[Activos]`, `[Completados]`, `[Cancelados]`.
  - Card para activar el perfil de colaborador (*"¿Quieres hacer favores?"*) con subida de DNI, foto de perfil y selfie en vivo.
- **Modo Colaborador (`activeProfile = Collaborator`):**
  - Vista *"Favores disponibles"* para personas con verificación aprobada.
  - Filtros: `[Disponibles]`, `[Tomados]`, `[Historial]`.
  - Gestión de radio de cobertura y estado de disponibilidad (`Available`, `Busy`, `Disconnected`).
  - Excluye solicitudes confirmadas, completadas, canceladas o creadas por el mismo usuario.
- **Modo Negocio (`activeProfile = BusinessOwner`):**
  - Vista bloqueada si entra por URL directa con botón de un toque *"Usar como Cliente"* (`switchProfile('Customer')`) sin cerrar sesión.
- **Modo Conductor (`activeProfile = Driver`):**
  - Bloqueo de toma automática de favores: requiere verificación de colaborador aprobada para conmutar a modo Colaborador.
- **Modo Administrador (`activeProfile = Admin`):**
  - Redirección / aviso para gestionar favores y verificaciones desde `/admin/dashboard`.

---

## 2. Causa de los Problemas Anteriores

1. **Mezcla de Cliente / Colaborador / Historial:** El frontend y el backend consultaban la lista de favores sin segmentar por vista, devolviendo solicitudes de todos los usuarios a cualquier rol autenticado.
2. **Favores confirmados mostrados como disponibles:** No se filtraban los estados finales (`Confirmed`, `Cancelled`, `Delivered`) en la vista de disponibles.
3. **Textos técnicos y chips cortados:** La interfaz mostraba cadenas como `Community`, `PUBLIC`, `Confirmed` y chips con textos largos (`Para col...`) en contenedores rígidos sin ajuste responsivo.

---

## 3. Cambios en Backend (.NET 9)

- `IquitosDelivery.Application.DTOs.Community.CommunityRequestQueryRequest`: Agregada propiedad `View` (`my`, `available`, `assigned`, `history`).
- `IquitosDelivery.Application.Services.CommunityService`:
  - `GetRequestsAsync`: Implementado filtrado estricto según `request.View`:
    - `my`: `CreatedByUserId == userId`
    - `available`: `CreatedByUserId != userId && AssignedCollaboratorId == null && (Status == Published || Status == Searching)`
    - `assigned` / `taken`: `AssignedCollaborator.UserId == userId && (Status == Accepted || Status == InProcess || Status == Delivered)`
    - `history`: `(Status == Confirmed || Status == Cancelled)`
- `IquitosDelivery.Application.Services.AuthService`:
  - `GetAvailableProfiles`: Solo incluye `"Collaborator"` si `user.CollaboratorProfile` tiene `ApprovalStatus == Approved` e `IsIdentityVerified == true`.
  - `SwitchProfileAsync`: Valida que el cambio a `"Collaborator"` arroje mensajes explicativos si no tiene perfil (`"Solicita la verificación para hacer favores."`) o si está pendiente/rechazado (`"Tu perfil de colaborador aún no está aprobado."`).

---

## 4. Cambios en Frontend (Angular 21 + Tailwind)

- `community.models.ts` & `community-api.service.ts`: Soportan `view` en `CommunityRequestQueryRequest` y llamadas segmentadas.
- `role.utils.ts`:
  - `getDefaultRouteForProfile('Collaborator')` -> `'/community'`.
  - `getProfileDisplayName('Collaborator')` -> `'Colaborador'`.
- `community-hub-page.component.ts`:
  - Rediseño mobile-first y responsive (320px a 1024px).
  - Discriminación por `communityMode`: `customer`, `collaborator`, `driver`, `business-blocked`, `admin-redirect`.
  - Eliminación de términos en inglés y enums técnicos.
- `profile-mode-switcher-card.component.ts`:
  - Incorporada la opción de conmutar a `Colaborador` cuando el usuario cuenta con perfil aprobado.

---

## 5. Resultados de Validación

- **Backend:** `dotnet test` -> **134/134 pruebas superadas** (100%).
- **Frontend:** `npm test -- --watch=false` -> **16/16 pruebas superadas** (100%).
- **Frontend Build:** `npm run build` -> **Éxito (0 errores)**.
- **Backend Build:** `dotnet build` -> **Éxito (0 errores, 0 advertencias)**.
