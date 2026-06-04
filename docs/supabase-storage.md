# Supabase Storage

## Objetivo

Usar Supabase como almacenamiento en la nube para pruebas, con un bucket público llamado `appurape`.

## Lo que ya quedó preparado

- Se agregó una migración SQL en `supabase/migrations/20260604000000_create_appurape_storage_bucket.sql`.
- Se limpió `backend/src/IquitosDelivery.Api/appsettings.Development.json` para que no queden credenciales reales en el repo.

## Pasos en Supabase

1. Crea tu proyecto en Supabase.
2. Copia la `Project URL` y la `service_role key` desde el panel.
3. Ejecuta la migración SQL para crear el bucket `appurape`.
4. Sube tus archivos al bucket desde el dashboard o desde tu backend con la service key.

## Base de datos de desarrollo

- `Development` y `Testing` apuntan a la misma base de datos en Supabase.
- La conexión local queda solo como referencia de emergencia, por si necesitas volver a una BD local.

Referencia local comentada:

```text
# Host=localhost;Port=5432;Database=iquitos_delivery_db;Username=postgres;Password=postgres
```

## Variables a configurar

En `backend/src/IquitosDelivery.Api/appsettings.Development.json`, `User Secrets` o variables de entorno:

- `Storage:Provider = Supabase`
- `Storage:Supabase:Url`
- `Storage:Supabase:ServiceKey`
- `Storage:Supabase:Bucket = appurape`
- `Storage:PublicBaseUrl`
- `Email:Provider = Logging` en Render
- `frontend/client-app/src/environments/environment.ts` -> `storagePublicBaseUrl`
- `backend/src/IquitosDelivery.Api/appsettings.Development.json`
- `backend/src/IquitosDelivery.Api/appsettings.Testing.json`

Ejemplo con variables de entorno en PowerShell:

```powershell
$env:Storage__Provider="Supabase"
$env:Storage__Supabase__Url="https://<your-project>.supabase.co"
$env:Storage__Supabase__ServiceKey="<your-service-role-key>"
$env:Storage__Supabase__Bucket="appurape"
$env:Storage__PublicBaseUrl="https://<your-project>.supabase.co/storage/v1/object/public/appurape"
```

For the frontend, set `storagePublicBaseUrl` to the same base URL, for example:

```ts
storagePublicBaseUrl: 'https://<your-project>.supabase.co/storage/v1/object/public/appurape'
```

## Migraciones de base de datos

Las migraciones de EF Core ya viven en `backend/src/IquitosDelivery.Infrastructure/Persistence/Migrations`.

Si quieres mover la base de datos a Supabase Postgres, solo cambia `ConnectionStrings:DefaultConnection` por la cadena del proyecto Supabase y luego ejecuta:

```powershell
dotnet ef database update --project .\backend\src\IquitosDelivery.Infrastructure\IquitosDelivery.Infrastructure.csproj --startup-project .\backend\src\IquitosDelivery.Api\IquitosDelivery.Api.csproj
```

En esta rama ya quedó configurado para apuntar a Supabase en `Development` y `Testing`.
Render usa `Logging` para correo, así el código de verificación queda en logs y no depende de SMTP.

## Validación rápida

- Verifica que el bucket exista en `Storage > Buckets`.
- Confirma que la URL pública funcione en navegador.
- Si el backend sube archivos, prueba una subida con la `service_role key`.

## Nota de seguridad

No dejes la `service_role key` en archivos versionados. Si una clave real llegó a aparecer en Git, conviene rotarla en Supabase.
