# AppuraPe

**AppuraPe** es una red logística comunitaria mobile-first que conecta clientes, restaurantes, drivers, colaboradores y administradores en un flujo operativo completo para pedidos y apoyos cercanos.

El proyecto incluye backend .NET, una SPA Angular activa y documentacion tecnica de soporte para ejecucion local, correo y arquitectura.

## Que es AppuraPe

AppuraPe es un MVP funcional de logística comunitaria. Permite que un cliente explore restaurantes, revise menus publicos, cree pedidos y haga seguimiento del flujo. En paralelo, restaurantes, drivers y administradores cuentan con paneles para operar la red.

El producto visible se llama **AppuraPe**. Algunos nombres tecnicos internos del backend aun conservan el nombre historico `IquitosDelivery`, pero no forman parte del branding visible.

## Modulos del sistema

- **Customer**: experiencia publica para clientes, catalogo, menu, registro, login y pedidos.
- **Restaurant**: panel para gestionar perfil, categorias, productos y pedidos del restaurante.
- **Driver**: panel para revisar pedidos disponibles, tomar pedidos y actualizar estados.
- **Collaborator**: capa futura para usuarios verificados o de confianza que apoyan la red.
- **Admin**: panel administrativo para revisar, aprobar o rechazar restaurantes, drivers y colaboradores.

## Stack tecnologico

### Backend

- .NET Web API
- Entity Framework Core
- PostgreSQL
- JWT para autenticacion
- FluentValidation
- Swagger / OpenAPI

### Frontend

- Angular
- `frontend/ops-app`: SPA activa que unifica experiencia publica, operativa y administrativa
- `frontend/shared`: base compartida para utilidades y modelos comunes

### Correo

- Logging para desarrollo local
- Mailtrap para pruebas reales en sandbox
- SMTP para ambientes no locales

## Roles del sistema

- `Customer`
- `Restaurant`
- `Driver`
- `Admin`

Cada rol tiene rutas, permisos y experiencias separadas dentro del sistema.

## Flujo principal del negocio

1. El cliente se registra y verifica su correo.
2. El cliente inicia sesion y explora restaurantes disponibles.
3. El cliente revisa el menu publico de un restaurante.
4. El cliente crea un pedido.
5. El restaurante gestiona el pedido desde su panel.
6. El driver revisa pedidos disponibles, toma pedidos y actualiza el avance.
7. El administrador gestiona aprobaciones de restaurantes, drivers y colaboradores.

## Registro con verificacion por correo

AppuraPe implementa registro por correo con codigo de verificacion para:

- Customer
- Restaurant
- Driver
- Collaborator

El flujo general es:

1. El usuario inicia el registro con sus datos.
2. El backend genera un codigo de verificacion.
3. El codigo se envia segun el proveedor de correo configurado.
4. El usuario verifica el codigo.
5. El usuario completa el registro creando su contrasena.

Para restaurantes y drivers, la cuenta queda sujeta a revision administrativa antes de operar completamente.

## Estados importantes

### Usuarios

- `Pending`
- `Active`
- `Suspended`

### Aprobaciones

- `Pending`
- `Approved`
- `Rejected`

### Pedidos

- `Pending`
- `Accepted`
- `Preparing`
- `ReadyForPickup`
- `Assigned`
- `PickedUp`
- `OnTheWay`
- `Delivered`
- `Cancelled`

## Requisitos previos

- .NET SDK 9
- Node.js y npm
- PostgreSQL
- Angular CLI disponible via dependencias del proyecto
- `dotnet-ef` para aplicar migraciones si no esta instalado

Instalacion opcional de Entity Framework CLI:

```powershell
dotnet tool install --global dotnet-ef
```

## Ejecucion local

### Backend

Desde la raiz del repositorio:

```powershell
cd backend
dotnet restore
dotnet ef database update --project .\src\IquitosDelivery.Infrastructure\IquitosDelivery.Infrastructure.csproj --startup-project .\src\IquitosDelivery.Api\IquitosDelivery.Api.csproj
dotnet run --project .\src\IquitosDelivery.Api\IquitosDelivery.Api.csproj
```

Para compilar la solucion completa:

```powershell
cd backend
dotnet build .\IquitosDelivery.sln --no-restore -m:1
```

### Frontend unificado

```powershell
cd frontend\ops-app
npm install
npm start
```

La SPA unificada corre por defecto en `http://localhost:4201/`.

En Windows, si PowerShell bloquea `npm.ps1`, se puede usar `npm.cmd`:

```powershell
npm.cmd run build
```

## Despliegue en Render

El repo incluye un blueprint para backend en `render.yaml`.

- Servicio: `appurape-api`
- Ruta de health check: `/health`
- Dockerfile: `backend/Dockerfile`
- Ambiente por defecto: `Development` para modo dev en la nube

Variables que Render pedira o que debes revisar:

- `ConnectionStrings__DefaultConnection`
- `Jwt__Key`
- `Jwt__AccessTokenLifetimeMinutes` (recommended: `43200`, equivalent to 30 days)
- `OrderConfirmation__Key` (secreto aleatorio de al menos 32 bytes para los códigos de entrega)
- `FinanceV2__Enabled=false` durante la migración y conciliación histórica; cambiar a `true` solo después de completar QA y tener dos administradores distintos para aprobar liquidaciones
- `SeedUsers__SecondaryAdminPassword` crea de forma idempotente a `subadmin@appurape.local` (Kin Huaya). Debe ser un secreto distinto al del Admin principal y tener al menos 12 caracteres; si no está configurado, la cuenta secundaria no se crea.
- `Email__Provider=Logging`
- `Storage__Supabase__ServiceKey`

FinanceV2 usa `appurape-private` para comprobantes de Yape/Plin, reembolsos y liquidaciones. El bucket debe permanecer privado. El orden seguro de despliegue es: migración con la bandera desactivada, conciliación histórica, despliegue del frontend, QA en staging y finalmente activación de `FinanceV2__Enabled=true`.
 
Si quieres publicar la SPA unificada en Render despues, la dejamos como `Static Site` apuntando a `frontend/ops-app`.

## Configuracion de correo

AppuraPe soporta tres modos de correo:

- **Development -> Logging**: escribe el correo/codigo en logs para desarrollo local.
- **Testing -> Mailtrap**: envia correos reales a un sandbox de Mailtrap, sin llegar al inbox real del usuario.
- **Production -> SMTP**: usa un proveedor SMTP real configurado por ambiente.

Ejemplo para ejecutar la API en ambiente Testing:

```powershell
cd backend
$env:ASPNETCORE_ENVIRONMENT="Testing"
dotnet run --project .\src\IquitosDelivery.Api\IquitosDelivery.Api.csproj
```

## Variables y secretos

No se deben subir credenciales reales al repositorio. Usa User Secrets o variables de entorno para valores sensibles como:

- cadenas de conexion
- credenciales SMTP
- credenciales Mailtrap
- claves JWT de ambientes reales
- credenciales de Supabase Storage
- URL pública del bucket para el frontend
- cadena de conexión de Supabase para Development y Testing

Ejemplo con User Secrets:

```powershell
cd backend
dotnet user-secrets init --project .\src\IquitosDelivery.Api\IquitosDelivery.Api.csproj
dotnet user-secrets set "Email:SmtpUser" "your-mailtrap-user" --project .\src\IquitosDelivery.Api\IquitosDelivery.Api.csproj
dotnet user-secrets set "Email:SmtpPassword" "your-mailtrap-password" --project .\src\IquitosDelivery.Api\IquitosDelivery.Api.csproj
dotnet user-secrets set "Email:FromName" "AppuraPe Testing" --project .\src\IquitosDelivery.Api\IquitosDelivery.Api.csproj
```

Guia de Supabase Storage:

- `docs/supabase-storage.md`

Referencia local por si quieres volver a una BD local:

```text
ConnectionStrings__DefaultConnection="__SET_VIA_USER_SECRETS_OR_ENV__"
```

Ejemplo con variables de entorno:

```powershell
$env:ASPNETCORE_ENVIRONMENT="Testing"
$env:Email__SmtpUser="your-mailtrap-user"
$env:Email__SmtpPassword="your-mailtrap-password"
$env:Storage__Provider="Supabase"
$env:Storage__Supabase__Url="https://<your-project>.supabase.co"
$env:Storage__Supabase__ServiceKey="<your-service-role-key>"
$env:Storage__Supabase__Bucket="appurape"
$env:Storage__PublicBaseUrl="https://<your-project>.supabase.co/storage/v1/object/public/appurape"
```

## Login rapido con Google

AppuraPe ya puede autenticarse con Google para cuentas `Customer`.

### Backend

Debes registrar los Client IDs permitidos para validar el `idToken` de Google:

```powershell
$env:GoogleAuth__AllowedClientIds__0="<google-web-client-id>.apps.googleusercontent.com"
```

Si despues agregas login nativo para Capacitor, puedes sumar mas Client IDs:

```powershell
$env:GoogleAuth__AllowedClientIds__1="<google-android-o-ios-client-id>.apps.googleusercontent.com"
```

### Frontend

Configura el Client ID web en:

- `frontend/ops-app/src/environments/environment.development.ts`
- `frontend/ops-app/src/environments/environment.ts`

Propiedad:

```ts
googleClientId: '<google-web-client-id>.apps.googleusercontent.com'
```

Si vas a exportar con Capacitor, agrega tambien:

```ts
googleIosClientId: '<google-ios-client-id>.apps.googleusercontent.com',
googleIosServerClientId: '<google-web-client-id>.apps.googleusercontent.com'
```

Notas:

- `googleClientId` se usa para Web y Android.
- `googleIosClientId` se usa para iPhone/iPad.
- `googleIosServerClientId` es opcional para este flujo online, pero conviene dejarlo igual al Web Client ID si luego amplias el flujo nativo.

### Capacitor

El frontend ya incluye `@capgo/capacitor-social-login` para login nativo de Google.

Despues de instalar dependencias o cambiar plugins, sincroniza Capacitor:

```powershell
cd frontend\ops-app
npx cap sync android
```

Para que el backend acepte tokens nativos, registra tambien los Client IDs moviles en `GoogleAuth__AllowedClientIds`.

### Flujo actual

- El login con Google crea o vincula cuentas `Customer`.
- Si el correo ya pertenece a `Restaurant`, `Driver` o `Admin`, el acceso por Google se rechaza.
- En navegador usa Google Identity Services; en la app móvil usa el selector nativo de Google.
- El backend valida el token de Google y luego emite el JWT propio de AppuraPe.

## Recuperacion de contrasena

AppuraPe ya incluye recuperacion de contrasena por codigo enviado al correo.

### Endpoints

- `POST /api/auth/password/forgot`
- `POST /api/auth/password/resend-code`
- `POST /api/auth/password/reset`

### Flujo

- El usuario ingresa su correo.
- El sistema envia un codigo de 6 digitos si la cuenta existe.
- El usuario ingresa el codigo y define una nueva contrasena.
- El codigo vence en 10 minutos.

### Frontend

La pantalla publica ya existe en:

- `frontend/ops-app/src/app/features/auth/forgot-password-page.component.ts`

Y se accede desde:

- `frontend/ops-app/src/app/features/auth/login-page.component.ts`

## Estructura del repositorio

```text
.
├── backend
│   ├── src
│   │   ├── IquitosDelivery.Api
│   │   ├── IquitosDelivery.Application
│   │   ├── IquitosDelivery.Domain
│   │   └── IquitosDelivery.Infrastructure
│   ├── tests
│   └── IquitosDelivery.sln
├── frontend
│   ├── ops-app
│   └── shared
├── docs
└── README.md
```

## Estado actual del MVP

Implementado:

- registro Customer con verificacion por correo
- registro Restaurant con verificacion por correo
- registro Driver con verificacion por correo
- login JWT por roles
- catalogo publico de restaurantes
- menu publico
- creacion de pedidos
- gestion de pedidos por restaurante
- flujo operativo de driver
- base de red comunitaria para colaboradores
- panel admin para restaurantes, drivers y colaboradores
- proveedores de correo Logging, Mailtrap y SMTP
- mejoras responsive y enfoque mobile-first
- SPA unificada para customer + ops

Pendiente o futuro:

- frontend unificada en `ops-app`
- imagenes reales de restaurantes/productos
- pagos reales
- tracking en tiempo real
- notificaciones
- mejoras visuales adicionales

## Convencion de ramas sugerida

- `main`: version estable o lista para demo.
- `develop`: integracion de trabajo en curso.
- `feature/<nombre>`: nuevas funcionalidades.
- `fix/<nombre>`: correcciones puntuales.
- `docs/<nombre>`: documentacion.
- `chore/<nombre>`: tareas tecnicas o mantenimiento.

## Notas importantes

- No renombrar carpetas, namespaces, proyectos `.csproj` ni solution solo por branding.
- Mantener AppuraPe como marca visible del producto.
- No commitear secretos, credenciales ni configuraciones reales de produccion.
- Validar migraciones y configuracion de PostgreSQL antes de levantar la API.
- Usar Mailtrap para pruebas de correo sin enviar mensajes a inboxes reales.

## Branding

Nombre visible oficial:

```text
AppuraPe
```

Usos aceptados:

- AppuraPe
- AppuraPe | Delivery local
- AppuraPe | Plataforma unificada
- AppuraPe Admin
- AppuraPe Restaurant
- AppuraPe Driver

## Cierre

AppuraPe es un MVP funcional de red logística comunitaria con backend, app web unificada y flujos operativos completos para clientes, restaurantes, drivers, colaboradores y administradores.


