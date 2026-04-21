# Email Providers

## Available providers

The backend supports three explicit email providers through `Email:Provider`.

- `Logging`: local development only. The verification email is written to API logs.
- `Mailtrap`: testing mode using Mailtrap Email Sandbox through SMTP.
- `Smtp`: standard SMTP delivery for non-local environments.

## Configuration files

- `backend/src/IquitosDelivery.Api/appsettings.json`
  Base config. Defaults to `Email:Provider = Smtp`.
- `backend/src/IquitosDelivery.Api/appsettings.Development.json`
  Overrides to `Email:Provider = Logging`.
- `backend/src/IquitosDelivery.Api/appsettings.Testing.json`
  Overrides to `Email:Provider = Mailtrap`.

## User Secrets

Use User Secrets on `IquitosDelivery.Api` to keep credentials out of Git.

Initialize once:

```powershell
dotnet user-secrets init --project .\backend\src\IquitosDelivery.Api\IquitosDelivery.Api.csproj
```

Set Mailtrap secrets:

```powershell
dotnet user-secrets set "Email:SmtpUser" "your-mailtrap-user" --project .\backend\src\IquitosDelivery.Api\IquitosDelivery.Api.csproj
dotnet user-secrets set "Email:SmtpPassword" "your-mailtrap-password" --project .\backend\src\IquitosDelivery.Api\IquitosDelivery.Api.csproj
```

Optional SMTP overrides:

```powershell
dotnet user-secrets set "Email:FromAddress" "sandbox@demomailtrap.com" --project .\backend\src\IquitosDelivery.Api\IquitosDelivery.Api.csproj
dotnet user-secrets set "Email:FromName" "AppuraPe Testing" --project .\backend\src\IquitosDelivery.Api\IquitosDelivery.Api.csproj
```

List secrets:

```powershell
dotnet user-secrets list --project .\backend\src\IquitosDelivery.Api\IquitosDelivery.Api.csproj
```

## Environment variables

You can also use environment variables instead of User Secrets:

```powershell
$env:ASPNETCORE_ENVIRONMENT="Testing"
$env:Email__SmtpUser="your-mailtrap-user"
$env:Email__SmtpPassword="your-mailtrap-password"
```

## Run the API in Testing

```powershell
$env:ASPNETCORE_ENVIRONMENT="Testing"
dotnet run --project .\backend\src\IquitosDelivery.Api\IquitosDelivery.Api.csproj
```

## Test customer registration with Mailtrap

1. Set `ASPNETCORE_ENVIRONMENT=Testing`.
2. Load Mailtrap credentials using User Secrets or environment variables.
3. Run the API.
4. Call `POST /api/auth/register/customer/start` from Swagger.
5. Open the Mailtrap Email Sandbox inbox.
6. Copy the 6-digit verification code from the received email.
7. Call `POST /api/auth/register/customer/verify-code`.
8. Call `POST /api/auth/register/customer/complete`.
9. Use the returned JWT on `GET /api/auth/me`.

## Notes

- `Mailtrap` and `Smtp` both use the same SMTP sender implementation.
- The provider name is explicit in configuration for clarity.
- Invalid provider values fail fast with a clear configuration error when the email sender is resolved.
- No verification code is exposed in HTTP responses.
