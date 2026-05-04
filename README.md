# AppuraPe

**AppuraPe** es una plataforma de delivery local, mobile-first, que conecta clientes, restaurantes, drivers y administradores en un flujo operativo completo para pedidos locales.

El proyecto incluye backend .NET, dos aplicaciones Angular y documentacion tecnica de soporte para ejecucion local, correo y arquitectura.

## Que es AppuraPe

AppuraPe es un MVP funcional de delivery local. Permite que un cliente explore restaurantes, revise menus publicos, cree pedidos y haga seguimiento basico del flujo operativo. En paralelo, restaurantes, drivers y administradores cuentan con paneles separados para operar el negocio.

El producto visible se llama **AppuraPe**. Algunos nombres tecnicos internos del backend aun conservan el nombre historico `IquitosDelivery`, pero no forman parte del branding visible.

## Modulos del sistema

- **Customer**: experiencia publica para clientes, catalogo, menu, registro, login y pedidos.
- **Restaurant**: panel para gestionar perfil, categorias, productos y pedidos del restaurante.
- **Driver**: panel para revisar pedidos disponibles, tomar pedidos y actualizar estados.
- **Admin**: panel administrativo para revisar, aprobar o rechazar restaurantes y drivers.

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
- `frontend/client-app`: aplicacion publica para clientes
- `frontend/ops-app`: aplicacion operativa para restaurantes, drivers y administradores

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
7. El administrador gestiona aprobaciones de restaurantes y drivers.

## Registro con verificacion por correo

AppuraPe implementa registro por correo con codigo de verificacion para:

- Customer
- Restaurant
- Driver

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

### Client App

```powershell
cd frontend\client-app
npm install
npm start
```

### Ops App

```powershell
cd frontend\ops-app
npm install
npm start
```

Si se levantan ambas apps Angular al mismo tiempo, usa puertos distintos:

```powershell
npm start -- --port 4201
```

En Windows, si PowerShell bloquea `npm.ps1`, se puede usar `npm.cmd`:

```powershell
npm.cmd run build
```

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

Ejemplo con User Secrets:

```powershell
cd backend
dotnet user-secrets init --project .\src\IquitosDelivery.Api\IquitosDelivery.Api.csproj
dotnet user-secrets set "Email:SmtpUser" "your-mailtrap-user" --project .\src\IquitosDelivery.Api\IquitosDelivery.Api.csproj
dotnet user-secrets set "Email:SmtpPassword" "your-mailtrap-password" --project .\src\IquitosDelivery.Api\IquitosDelivery.Api.csproj
dotnet user-secrets set "Email:FromName" "AppuraPe Testing" --project .\src\IquitosDelivery.Api\IquitosDelivery.Api.csproj
```

Ejemplo con variables de entorno:

```powershell
$env:ASPNETCORE_ENVIRONMENT="Testing"
$env:Email__SmtpUser="your-mailtrap-user"
$env:Email__SmtpPassword="your-mailtrap-password"
```

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
│   ├── client-app
│   └── ops-app
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
- panel admin para restaurantes y drivers
- proveedores de correo Logging, Mailtrap y SMTP
- mejoras responsive y enfoque mobile-first

Pendiente o futuro:

- despliegue productivo
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
- AppuraPe | Panel operativo
- AppuraPe Admin
- AppuraPe Restaurant
- AppuraPe Driver

## Cierre

AppuraPe es un MVP funcional de delivery local con backend, apps web y flujos operativos completos para clientes, restaurantes, drivers y administradores.
