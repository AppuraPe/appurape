[CmdletBinding()]
param(
    [Parameter()]
    [ValidateNotNullOrEmpty()]
    [string]$BaseUrl = "https://appurape-mvp.onrender.com",

    [Parameter()]
    [string]$Email,

    [Parameter()]
    [ValidateNotNullOrEmpty()]
    [string]$Title = "Prueba AppuraPe",

    [Parameter()]
    [ValidateNotNullOrEmpty()]
    [string]$Body = "Firebase push funciona de extremo a extremo."
)

$ErrorActionPreference = "Stop"
$baseUri = [Uri]$BaseUrl
$isLocalHost = $baseUri.Host -in @("localhost", "127.0.0.1", "::1")

if ($baseUri.Scheme -ne "https" -and -not $isLocalHost) {
    throw "Usa HTTPS para enviar credenciales; HTTP solo se permite contra localhost."
}

if ([string]::IsNullOrWhiteSpace($Email)) {
    $Email = Read-Host "Email de la cuenta de prueba que tiene la APK instalada"
}

$securePassword = Read-Host "Contraseña" -AsSecureString
$plainPassword = [System.Net.NetworkCredential]::new("", $securePassword).Password
$normalizedBaseUrl = $BaseUrl.TrimEnd("/")

try {
    $loginPayload = @{
        email = $Email.Trim()
        password = $plainPassword
    } | ConvertTo-Json

    $session = Invoke-RestMethod `
        -Method Post `
        -Uri "$normalizedBaseUrl/api/auth/login" `
        -ContentType "application/json" `
        -Body $loginPayload

    $jwt = [string]$session.token
    if ([string]::IsNullOrWhiteSpace($jwt)) {
        throw "El login no devolvió un token de sesión."
    }

    $headers = @{ Authorization = "Bearer $jwt" }
    $testPayload = @{
        title = $Title
        body = $Body
        data = @{
            type = "manual_e2e_test"
        }
    } | ConvertTo-Json -Depth 4

    $result = Invoke-RestMethod `
        -Method Post `
        -Uri "$normalizedBaseUrl/api/notifications/test" `
        -Headers $headers `
        -ContentType "application/json" `
        -Body $testPayload

    $summary = [PSCustomObject]@{
        TokensFound = [int]$result.tokensFound
        SentOk = [int]$result.sentOk
        Failed = [int]$result.failed
        Deactivated = [int]$result.deactivated
        Message = [string]$result.message
    }

    $summary | Format-List

    if ($summary.TokensFound -eq 0) {
        throw "El backend no encontró un token activo. Abre la APK, inicia sesión y acepta las notificaciones antes de repetir la prueba."
    }

    if ($summary.SentOk -eq 0) {
        throw "FCM no aceptó la notificación. Revisa la configuración Firebase del backend y el token registrado."
    }

    Write-Host "FCM aceptó la notificación. Confirma ahora que llegó al dispositivo de esa cuenta." -ForegroundColor Green
}
finally {
    $plainPassword = $null
    $securePassword = $null
    $loginPayload = $null
    $session = $null
    $jwt = $null
    $headers = $null
}
