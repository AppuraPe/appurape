## Configuracion local segura

Este archivo documenta solo placeholders y comandos locales. No guardes secretos reales en el repo.

### User-secrets recomendados

```powershell
cd backend
dotnet user-secrets init --project .\src\IquitosDelivery.Api\IquitosDelivery.Api.csproj

dotnet user-secrets set "ConnectionStrings:DefaultConnection" "__SET_VIA_USER_SECRETS_OR_ENV__" --project .\src\IquitosDelivery.Api\IquitosDelivery.Api.csproj
dotnet user-secrets set "Jwt:Key" "__SET_VIA_USER_SECRETS_OR_ENV__" --project .\src\IquitosDelivery.Api\IquitosDelivery.Api.csproj
dotnet user-secrets set "Storage:Supabase:Url" "__SET_VIA_USER_SECRETS_OR_ENV__" --project .\src\IquitosDelivery.Api\IquitosDelivery.Api.csproj
dotnet user-secrets set "Storage:Supabase:ServiceKey" "__SET_VIA_USER_SECRETS_OR_ENV__" --project .\src\IquitosDelivery.Api\IquitosDelivery.Api.csproj
dotnet user-secrets set "SeedUsers:AdminPassword" "__SET_VIA_USER_SECRETS_OR_ENV__" --project .\src\IquitosDelivery.Api\IquitosDelivery.Api.csproj
dotnet user-secrets set "SeedUsers:QaPassword" "__SET_VIA_USER_SECRETS_OR_ENV__" --project .\src\IquitosDelivery.Api\IquitosDelivery.Api.csproj
```

### Variables de entorno equivalentes

```powershell
$env:ConnectionStrings__DefaultConnection="__SET_VIA_USER_SECRETS_OR_ENV__"
$env:Jwt__Key="__SET_VIA_USER_SECRETS_OR_ENV__"
$env:Storage__Supabase__Url="__SET_VIA_USER_SECRETS_OR_ENV__"
$env:Storage__Supabase__ServiceKey="__SET_VIA_USER_SECRETS_OR_ENV__"
$env:SeedUsers__AdminPassword="__SET_VIA_USER_SECRETS_OR_ENV__"
$env:SeedUsers__QaPassword="__SET_VIA_USER_SECRETS_OR_ENV__"
```

### Notas

- `AppDbContextFactory` usa `ConnectionStrings:DefaultConnection` desde environment variables o user-secrets del proyecto API.
- El seeding usa `SeedUsers:AdminPassword` y `SeedUsers:QaPassword`.
- Si no configuras passwords de seed, el entorno local cae en `ChangeMe.LocalOnly.123!`.
