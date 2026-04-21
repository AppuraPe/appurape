# Local Email Testing

For provider selection, Mailtrap setup, User Secrets, and Testing environment usage, see [email-providers.md](/abs/path/C:/Users/NAYCOLL/IquitosDelivery/docs/email-providers.md:1).

## Quick local flow

1. Run the API with `ASPNETCORE_ENVIRONMENT=Development`.
2. Call `POST /api/auth/register/customer/start`.
3. Read the verification code from the API logs.
4. Call `POST /api/auth/register/customer/verify-code`.
5. Call `POST /api/auth/register/customer/complete`.
