# AppuraPe Architecture

## Resumen

AppuraPe se plantea como un monolito modular con backend en ASP.NET Core Web API y PostgreSQL como base de datos principal. La estructura separa responsabilidades en capas ligeras para mantener orden y facilitar crecimiento sin introducir la complejidad de microservicios.

## Capas

- `IquitosDelivery.Api`: punto de entrada HTTP, configuracion base, middlewares y controllers.
- `IquitosDelivery.Application`: casos de uso, contratos, DTOs, validaciones y servicios de aplicacion.
- `IquitosDelivery.Domain`: nucleo del negocio, entidades, enums y componentes comunes.
- `IquitosDelivery.Infrastructure`: persistencia, seguridad e implementaciones tecnicas.
- `IquitosDelivery.Tests`: pruebas del backend.

## Frontend

La SPA activa es `ops-app`, que unifica la experiencia publica, operativa y administrativa.

- `ops-app`: frontend oficial.
- `shared`: utilidades y base compartida entre features.
