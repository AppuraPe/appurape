# FASE 3: Implementación de activeProfile y switch-profile en AppuraPe

**Fecha:** 2026-08-18  
**Proyecto:** AppuraPe / IquitosDelivery  
**Tecnologías:** .NET 9 Clean Architecture (Backend) + Angular 21 (Frontend)

---

## 1. Resumen de lo Implementado

Se implementó el sistema de conmutación de perfiles (`activeProfile` y `POST /api/auth/switch-profile`) permitiendo que los usuarios de AppuraPe alternen su modo de operación entre **Cliente**, **Negocio**, **Repartidor** y **Administrador** con su misma cuenta, sin crear cuentas duplicadas ni cerrar sesión.

### Aspectos Clave:
- **Identidad Principal:** La entidad `User` en base de datos mantiene su `User.Role` original intacto (rol base).
- **Modo Activo (`activeProfile`):** Define el contexto operativo de la sesión.
- **Claims JWT:** El token emitido ahora viaja con:
  - `ClaimTypes.Role`: Rol efectivo (`Customer`, `Restaurant`, `Driver`, `Admin`) para compatibilidad inmediata con `[Authorize(Roles = "...")]` y `roleGuard`.
  - `active_profile`: Perfil en uso (`Customer`, `BusinessOwner`, `Driver`, `Admin`, `Collaborator`).
  - `primary_role`: Rol base original del `User`.
- **Creación Automática de `CustomerProfile`:** Cuando un usuario de negocio o repartidor cambia a modo Cliente por primera vez, el backend crea automáticamente su registro en la tabla `customer_profiles` de manera transparente e idempotente.
- **UI en Perfiles:** Tarjeta *"Modo de uso"* integrada en `/account/profile`, `/business/profile` y `/driver/profile` con diseño responsive (soporta desde 320px hasta desktop) y etiquetas amigables en español.

---

## 2. Cambios en Backend (.NET 9)

### A. Constantes y Mapeos (`UserProfiles.cs`)
Ubicación: `IquitosDelivery.Application.Common.UserProfiles.cs`
- `Customer = "Customer"`
- `BusinessOwner = "BusinessOwner"`
- `Driver = "Driver"`
- `Collaborator = "Collaborator"`
- `Admin = "Admin"`
- Métodos: `RoleToDefaultProfile`, `ProfileToEffectiveRole`, `IsValidProfile`.

### B. DTOs de Autenticación
- `SwitchProfileRequest.cs`: `{ Profile: string }`
- `AuthResponse.cs` y `CurrentUserResponse.cs`: Agregadas propiedades `ActiveProfile` y `PrimaryRole`.

### C. Generador de JWT (`JwtTokenService.cs`)
- Soporta `GenerateToken(User user, string? activeProfile = null)`.
- Emite claims `active_profile`, `primary_role` y rol efectivo en `ClaimTypes.Role`.

### D. Servicio de Autenticación (`AuthService.cs`)
- `GetAvailableProfiles`: Incluye `"Customer"` para usuarios con rol base `Customer`, `Restaurant` y `Driver` o con `CustomerProfile` existente.
- `SwitchProfileAsync`:
  1. Valida autenticación y estado del usuario.
  2. Valida que el perfil solicitado esté en sus `availableProfiles`.
  3. Si el perfil es `"Customer"` y no existe `CustomerProfile`, lo crea y persiste en BD.
  4. Genera nuevo JWT con el nuevo `activeProfile` y rol efectivo.
- `GetCurrentUserAsync`: Lee `active_profile` del claim o aplica fallback al perfil por defecto según `User.Role`.

### E. Controlador (`AuthController.cs`)
- Endpoint: `POST /api/auth/switch-profile` (`[Authorize]`).

---

## 3. Cambios en Frontend (Angular 21 + Tailwind)

### A. Modelos (`auth.models.ts`)
- Tipo `AppProfile = 'Customer' | 'BusinessOwner' | 'Driver' | 'Collaborator' | 'Admin'`.
- `SwitchProfileRequest`, `activeProfile`, `primaryRole`, `availableProfiles`.

### B. Utilidades (`role.utils.ts`)
- `profileToEffectiveRole`: Mapea `BusinessOwner` -> `'Restaurant'`, `Customer` -> `'Customer'`, `Driver` -> `'Driver'`, etc.
- `roleToDefaultProfile`: Mapea `'Restaurant'` -> `'BusinessOwner'`, etc.
- `getDefaultRouteForProfile`: Mapea `BusinessOwner` -> `'/business/dashboard'`, `Customer` -> `'/businesses'`, etc.
- `getProfileDisplayName`: Etiquetas en español (`Negocio`, `Cliente`, `Repartidor`, `Administrador`).

### C. Almacenamiento de Sesión (`AuthSessionStore` y `AuthService`)
- Persistencia de `activeProfile`, `primaryRole` y `availableProfiles` en `localStorage`.
- Signal reactivo `activeProfile()` y `currentRole()` actualizado al rol efectivo del perfil activo.
- Método `switchProfile(profile: AppProfile)`: Ejecuta la petición al backend, actualiza token/sesión y redirige a la ruta correspondiente.

### D. Componente Visual (`ProfileModeSwitcherCardComponent`)
- Card responsive con estados:
  - *Activo ahora* (perfil actual).
  - *Usar como [Perfil]* (perfil ya disponible).
  - *Activar y usar* (activar modo Cliente para negocio/driver).
  - *Próximamente* (para roles en preparación como Colaborador).

---

## 4. Matriz de Conmutación y Navegación

| Perfil Solicitado | Rol Efectivo | Claim JWT `Role` | Ruta por Defecto |
| :--- | :--- | :--- | :--- |
| `Customer` | `Customer` | `Customer` | `/businesses` |
| `BusinessOwner` | `Restaurant` | `Restaurant` | `/business/dashboard` |
| `Driver` | `Driver` | `Driver` | `/driver/dashboard` |
| `Admin` | `Admin` | `Admin` | `/admin/dashboard` |

---

## 5. Pruebas y Validación

- **Backend:** `dotnet test` -> **132/132 pruebas superadas** (100% éxito).
- **Frontend:** `npm test -- --watch=false` -> **16/16 pruebas superadas** (100% éxito).
- **Compilación Frontend:** `npm run build` -> **Éxito (0 errores)**.
- **Compilación Backend:** `dotnet build` -> **Éxito (0 errores, 0 advertencias)**.
