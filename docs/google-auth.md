# Google Auth en AppuraPe

AppuraPe ya tiene login con Google integrado para clientes.

## Flujo actual

1. Web o APK obtiene un `idToken` de Google.
2. El frontend envía ese token a `POST /api/auth/google`.
3. El backend valida el token con Google.
4. El backend crea o vincula una cuenta `Customer`.
5. Si el email ya existe pero pertenece a `Restaurant`, `Driver` o `Admin`, el backend rechaza el login con Google.

Por ahora Google Auth es solo para clientes.

## Datos necesarios de Google/Firebase

Necesitas crear/configurar estos clientes OAuth:

- `Web client ID`: se usa en Angular web, APK Android y backend.
- `Android OAuth client`: se crea con package name y SHA-1/SHA-256.
- `google-services.json`: archivo Android del proyecto Firebase.
- `iOS client ID`: solo si luego se compila iOS.

## Package Android

La app Android usa:

```text
com.appurape.app
```

Ese package debe coincidir en:

- Firebase Android app.
- Google Cloud OAuth Android client.
- `frontend/ops-app/android/app/build.gradle`.

## SHA necesarios para Android

Para Android debes registrar al menos:

- SHA-1 debug local.
- SHA-256 debug local.
- SHA-1 release si firmas APK/AAB.
- SHA-256 release si firmas APK/AAB.

Comando típico para debug:

```powershell
keytool -list -v -alias androiddebugkey -keystore "$env:USERPROFILE\.android\debug.keystore" -storepass android -keypass android
```

## Configuración frontend

En Angular configura el Web client ID:

```ts
googleClientId: 'TU_WEB_CLIENT_ID.apps.googleusercontent.com'
```

Archivos:

```text
frontend/ops-app/src/environments/environment.ts
frontend/ops-app/src/environments/environment.development.ts
```

Para iOS, cuando aplique:

```ts
googleIosClientId: 'TU_IOS_CLIENT_ID.apps.googleusercontent.com'
googleIosServerClientId: 'TU_WEB_CLIENT_ID.apps.googleusercontent.com'
```

## Configuración backend

El backend debe aceptar como audiencia el mismo `Web client ID`.

En Render o variables locales:

```text
GoogleAuth__AllowedClientIds__0=TU_WEB_CLIENT_ID.apps.googleusercontent.com
```

Si usas más de un client ID:

```text
GoogleAuth__AllowedClientIds__0=TU_WEB_CLIENT_ID.apps.googleusercontent.com
GoogleAuth__AllowedClientIds__1=OTRO_CLIENT_ID.apps.googleusercontent.com
```

No pongas secretos aquí: los Client IDs no son secretos.

## Archivo Android

Coloca:

```text
frontend/ops-app/android/app/google-services.json
```

No lo subas al repo. Ya está ignorado por `.gitignore`.

## Authorized JavaScript origins

En el OAuth Web client agrega, según entorno:

```text
http://localhost:4201
http://localhost:4200
```

Cuando exista frontend publicado, agrega también el dominio web real.

## Validación

1. Configurar `googleClientId` en frontend.
2. Configurar `GoogleAuth__AllowedClientIds__0` en backend.
3. Colocar `google-services.json` en Android.
4. Ejecutar `npm run build`.
5. Ejecutar `dotnet test backend/IquitosDelivery.sln --no-build`.
6. Probar `/login`.
7. En web debe verse el botón Google.
8. En APK debe abrir selector nativo Google.
9. El backend debe responder `200` en `POST /api/auth/google`.

## Limitación actual

Google Auth solo habilita o vincula cuentas `Customer`.

No permite entrar como:

- negocio;
- driver;
- admin.

Eso es intencional en el MVP para evitar cruces de roles.
