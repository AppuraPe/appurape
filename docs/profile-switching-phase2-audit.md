# Auditoría Técnica FASE 2: Perfiles Múltiples y Diseño de activeProfile en AppuraPe

**Fecha:** 2026-08-18  
**Proyecto:** AppuraPe / IquitosDelivery  
**Arquitectura:** .NET 9 Clean Architecture (Backend) + Angular 21 (Frontend)

---

## 1. Resumen Ejecutivo
- **Estado Actual:** El backend ya modela perfiles múltiples a nivel de entidades en `User` (`CustomerProfile`, `DriverProfile`, `CollaboratorProfile`, `OwnedRestaurants`) y calcula `availableProfiles: string[]`.
- **Limitación Actual:** El token JWT se firma con un solo `Role` fijo (`ClaimTypes.Role`) determinado en el registro/login. No existe el concepto de `activeProfile` ni endpoint de conmutación (`switch-profile`).
- **Estado del Frontend:** En la FASE 1 se aislaron y corrigieron las rutas y navegaciones por rol. El frontend cuenta con los modelos TypeScript preparados (`availableProfiles` en `CurrentUserResponse`), pero la sesión se rige exclusivamente por `Role`.

---

## 2. Modelo de Entidades en Backend
- **`User.cs` (`IquitosDelivery.Domain.Entities.User`):**
  - Es la identidad central del sistema.
  - Relación 1:1 opcional con `CustomerProfile` (`UserId`).
  - Relación 1:1 opcional con `DriverProfile` (`UserId`).
  - Relación 1:1 opcional con `CollaboratorProfile` (`UserId`).
  - Relación 1:1 opcional con `CommunityCollaborator` (`UserId`).
  - Relación 1:N con `Restaurant` (`OwnerUserId`).
- **Unicidad:**
  - `Email` es único en `users`.
  - `GoogleSubject` es único en `users`.
  - `DocumentNumber` / `Dni` se diseñó con índice único filtrado para nivel `User`.

---

## 3. Cálculo y Flujo de `availableProfiles`
- **Ubicación:** `IquitosDelivery.Application.Services.AuthService.cs` (líneas 568-598).
- **Lógica de Inclusión:**
  - `"Customer"`: si `user.CustomerProfile != null || user.Role == UserRole.Customer`.
  - `"BusinessOwner"`: si `user.OwnedRestaurants.Any() || user.Role == UserRole.Restaurant`.
  - `"Driver"`: si `user.DriverProfile != null || user.Role == UserRole.Driver`.
  - `"Collaborator"`: si `user.CollaboratorProfile != null || user.CommunityCollaborator != null`.
  - `"Admin"`: si `user.Role == UserRole.Admin`.
- **Entrega:** Se devuelve en `AuthResponse` (`POST /api/auth/login`) y en `CurrentUserResponse` (`GET /api/auth/me`).

---

## 4. Estructura de JWT y Claims
- **Generador:** `IquitosDelivery.Infrastructure.Security.JwtTokenService.cs`.
- **Claims actuales:** `Sub`, `NameIdentifier`, `Email`, `ClaimTypes.Role`, `Jti`.
- **Observaciones:**
  - No existe claim `activeProfile`.
  - No existe endpoint de refresh token.
  - El token emitido está anclado a un único rol.

---

## 5. Diseño Técnico Propuesto para FASE 3 (`activeProfile` y `switch-profile`)

### A. Modelo de Sesión con `activeProfile`
- **Claim en JWT:** Añadir claim `active_profile` (o `activeProfile`) en el JWT.
- **DTOs:** Incluir `activeProfile: string` en `AuthResponse` y `CurrentUserResponse`.

### B. Endpoint de Conmutación
- **Ruta:** `POST /api/auth/switch-profile`
- **Body:** `{ "profile": "Customer" | "BusinessOwner" | "Driver" | "Collaborator" }`
- **Validaciones:**
  1. Usuario autenticado.
  2. El perfil solicitado pertenece a `availableProfiles` del usuario.
  3. El perfil no está suspendido.
  4. Si se solicita `"Customer"` y el usuario no tiene `CustomerProfile`, se crea automáticamente de forma transparente.
- **Respuesta:** Nuevo token JWT firmado con el `activeProfile` seleccionado y objeto `user` actualizado.

---

## 6. Recomendación de Perfil Cliente por Defecto
- **Recomendación:** **Opción A (Todo usuario tiene `CustomerProfile` básico).**
  - Justificación: Permite que repartidores y dueños de negocio puedan comprar comida en la app inmediatamente sin formularios de registro adicionales, aumentando la conversión y usabilidad de la plataforma.
