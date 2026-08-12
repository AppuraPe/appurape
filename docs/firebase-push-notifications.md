# Firebase Cloud Messaging en AppuraPe

AppuraPe usa Firebase Cloud Messaging mediante la API HTTP v1 desde el backend.

## Flujo

1. La APK de operaciones obtiene un token FCM con Capacitor Push Notifications.
2. Al iniciar o restaurar una sesión, el frontend registra el token en `POST /api/notifications/device-token`.
3. El backend guarda el token en `UserDeviceTokens`.
4. Los servicios de pedidos, pagos, driver y Community llaman a `INotificationService`.
5. `FirebasePushNotificationSender` envía el mensaje a FCM.
6. Al tocar una push, la app usa `data.targetRoute` para navegar.

El token se vincula siempre al usuario autenticado por el JWT. Cuando FCM rota el token, el listener nativo lo normaliza, lo guarda localmente y vuelve a sincronizarlo; al cerrar sesión se desactiva en el backend.

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

## Canal Android

El backend envía todas las notificaciones Android con:

```text
channel_id=appurape_default
```

La APK crea ese mismo canal antes de solicitar permisos y antes de registrarse con FCM. El canal se llama `Pedidos y operaciones`, usa importancia alta, vibración y visibilidad privada en la pantalla bloqueada. El `AndroidManifest.xml` también declara `appurape_default` como canal predeterminado de Firebase, y Capacitor muestra alertas recibidas mientras la app está en primer plano.

No cambies el ID en un solo lado: debe coincidir entre `FirebasePushNotificationSender`, `PushNotificationService` y el manifest Android. Android conserva las preferencias del canal después de crearlo; para comprobar valores iniciales nuevos en un dispositivo de QA que ya tenía la app, desinstala la APK antes de instalar la nueva versión.

## Endpoints de prueba

Con sesión iniciada en la APK:

```text
POST /api/notifications/device-token
POST /api/notifications/test
GET /api/notifications/device-token/status
```

`GET /api/notifications/device-token/status` solo responde en ambiente `Development`.

`POST /api/notifications/test` solo usa los tokens activos del usuario autenticado. No acepta un token FCM arbitrario ni permite enviar a otro usuario.

## Prueba end-to-end segura

Usa una cuenta dedicada de QA que haya iniciado sesión en la APK. El script inicia sesión con la contraseña solicitada de forma oculta, no imprime el JWT ni el token FCM y rechaza HTTP salvo para `localhost`:

```powershell
cd frontend/ops-app
.\scripts\test-push-e2e.ps1 -BaseUrl "https://appurape-mvp.onrender.com"
```

También puedes pasar `-Email qa@appurape.test`; nunca pases la contraseña ni un JWT como argumento de línea de comandos. El resultado seguro solo muestra contadores:

- `TokensFound > 0` confirma que el token de la APK quedó registrado para esa cuenta;
- `SentOk > 0` confirma que Firebase aceptó el envío;
- la recepción visible en el teléfono completa la validación end-to-end.

## Eventos ya conectados

El backend envía notificaciones para eventos de:

- pedidos de cliente;
- pedidos del negocio;
- asignación y avance de driver;
- confirmación/rechazo de pagos;
- Community/Favores.

## Validación recomendada

1. Colocar `google-services.json` y generar/sincronizar la APK con `npm run android:dev`.
2. Instalarla en un Android real con Google Play Services.
3. Iniciar sesión con la cuenta de QA y aceptar el permiso de notificaciones.
4. Ejecutar `scripts/test-push-e2e.ps1` y comprobar `TokensFound > 0` y `SentOk > 0`.
5. Verificar la alerta con la app en primer plano y en segundo plano.
6. Crear eventos reales: pedido, pago Yape/Plin, driver y Community.
7. Verificar que cada push navegue con `targetRoute`.
