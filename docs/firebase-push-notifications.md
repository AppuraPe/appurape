# Firebase Cloud Messaging en AppuraPe

AppuraPe usa Firebase Cloud Messaging mediante la API HTTP v1 desde el backend.

## Flujo

1. La APK Android obtiene un token FCM con Capacitor Push Notifications.
2. El frontend registra el token en `POST /api/notifications/device-token`.
3. El backend guarda el token en `UserDeviceTokens`.
4. Los servicios de pedidos, pagos, driver y Community llaman a `INotificationService`.
5. `FirebasePushNotificationSender` envía el mensaje a FCM.
6. Al tocar una push, la app usa `data.targetRoute` para navegar.

## Datos necesarios de Firebase

Necesitas estos datos del proyecto Firebase:

- `ProjectId`: ID del proyecto Firebase, no el nombre visible.
- `ServiceAccountJson`: JSON completo de una cuenta de servicio con permisos para Firebase Cloud Messaging.
- `google-services.json`: archivo Android generado por Firebase para la app Android.

No subas `google-services.json` ni el JSON de service account al repo.

## Variables de entorno backend

Configura el backend con variables de entorno:

```text
Firebase__Enabled=true
Firebase__ProjectId=tu-project-id
Firebase__CredentialsJson={...json de service account...}
```

También puedes usar una ruta local fuera del repo:

```text
Firebase__Enabled=true
Firebase__ProjectId=tu-project-id
Firebase__CredentialsPath=C:\secrets\appurape-firebase-service-account.json
```

Usa `CredentialsJson` en Render y `CredentialsPath` solo para desarrollo local si prefieres no pegar JSON en variables.

## Variables en Render Development

En el servicio backend de Render agrega:

```text
Firebase__Enabled=true
Firebase__ProjectId=<project-id>
Firebase__CredentialsJson=<service-account-json-completo>
```

No imprimas esos valores en logs ni reportes.

## Archivo Android

Coloca `google-services.json` en el módulo Android generado por Capacitor, normalmente:

```text
frontend/ops-app/android/app/google-services.json
```

El archivo está ignorado por `.gitignore`; debe vivir solo en tu máquina o en el mecanismo seguro de build.

## Endpoints de prueba

Con sesión iniciada en la APK:

```text
POST /api/notifications/device-token
POST /api/notifications/test
GET /api/notifications/device-token/status
```

`GET /api/notifications/device-token/status` solo responde en ambiente `Development`.

## Eventos ya conectados

El backend envía notificaciones para eventos de:

- pedidos de cliente;
- pedidos del negocio;
- asignación y avance de driver;
- confirmación/rechazo de pagos;
- Community/Favores.

## Validación recomendada

1. Instalar APK en Android real.
2. Iniciar sesión.
3. Aceptar permiso de notificaciones.
4. Confirmar que se crea token activo en `UserDeviceTokens`.
5. Ejecutar `POST /api/notifications/test`.
6. Crear eventos reales: pedido, pago Yape/Plin, driver, Community.
7. Verificar que cada push navegue con `targetRoute`.
