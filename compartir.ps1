<#
  Levanta todo el proyecto con un solo comando.

    .\compartir.ps1            Túneles de Cloudflare + backend + frontend (URL pública para compartir)
    .\compartir.ps1 -Local     Solo backend + frontend en localhost (sin túneles)
    .\compartir.ps1 -Detener   Apaga backend, frontend y túneles, y deja los .env en localhost

  Qué hace en modo público:
    1. Detiene lo que estuviera corriendo (puertos 3000/3001 y cloudflared).
    2. Abre un túnel para el backend y otro para el frontend y lee sus URLs.
    3. Escribe esas URLs en backend-biblioteca/.env (CORS_ORIGIN) y frontend-biblioteca/.env.local (NEXT_PUBLIC_API_URL).
    4. Arranca el backend, compila el frontend (la URL de la API se incrusta al compilar) y lo arranca.
    5. Comprueba que todo responde y copia la URL pública al portapapeles.
#>
param(
  [switch]$Local,
  [switch]$Detener
)

$ErrorActionPreference = 'Stop'
$raiz      = $PSScriptRoot
$backend   = Join-Path $raiz 'backend-biblioteca'
$frontend  = Join-Path $raiz 'frontend-biblioteca'
$envBack   = Join-Path $backend '.env'
$envFront  = Join-Path $frontend '.env.local'
$logs      = Join-Path $env:TEMP 'la-biblioteca-logs'
$apiLocal  = 'http://localhost:3001/api'
$corsLocal = 'http://localhost:3000'
$utf8      = New-Object System.Text.UTF8Encoding($false)

function Paso($texto) { Write-Host "`n>> $texto" -ForegroundColor Cyan }
function Falla($texto) { Write-Host "ERROR: $texto" -ForegroundColor Red; exit 1 }

function Detener-Todo {
  Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force
  foreach ($puerto in 3000, 3001) {
    Get-NetTCPConnection -LocalPort $puerto -State Listen -ErrorAction SilentlyContinue |
      ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
  }
  Start-Sleep -Seconds 1
}

# Reemplaza el valor de una variable de un .env sin tocar el resto del archivo
function Set-EnvVar($archivo, $nombre, $valor) {
  $contenido = [System.IO.File]::ReadAllText($archivo)
  $patron = "(?m)^$([regex]::Escape($nombre))=.*$"
  if ($contenido -match $patron) {
    $contenido = [regex]::Replace($contenido, $patron, { param($m) "$nombre=$valor" })
  } else {
    $contenido = $contenido.TrimEnd() + "`r`n$nombre=$valor`r`n"
  }
  [System.IO.File]::WriteAllText($archivo, $contenido, $utf8)
}

function Esperar-Url($archivoLog, $segundos = 60) {
  $limite = (Get-Date).AddSeconds($segundos)
  while ((Get-Date) -lt $limite) {
    if (Test-Path $archivoLog) {
      $m = Select-String -Path $archivoLog -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' -ErrorAction SilentlyContinue | Select-Object -First 1
      if ($m) { return $m.Matches[0].Value }
    }
    Start-Sleep -Milliseconds 500
  }
  return $null
}

function Esperar-Http($url, $segundos = 60) {
  $limite = (Get-Date).AddSeconds($segundos)
  while ((Get-Date) -lt $limite) {
    try { if ((Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 10).StatusCode -eq 200) { return $true } } catch { }
    Start-Sleep -Seconds 1
  }
  return $false
}

foreach ($archivo in $envBack, $envFront) {
  if (-not (Test-Path $archivo)) { Falla "No existe $archivo" }
}
New-Item -ItemType Directory -Force $logs | Out-Null

Paso 'Deteniendo procesos anteriores'
Detener-Todo

if ($Detener) {
  Set-EnvVar $envBack 'CORS_ORIGIN' $corsLocal
  Set-EnvVar $envFront 'NEXT_PUBLIC_API_URL' $apiLocal
  Write-Host 'Todo detenido. Los .env quedaron apuntando a localhost.' -ForegroundColor Green
  Write-Host 'Nota: el frontend compilado conserva la URL anterior; ejecuta .\compartir.ps1 -Local (o -sin parámetros) para recompilar.'
  exit 0
}

$urlBack = $null
$urlFront = $null

if (-not $Local) {
  if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
    Falla 'cloudflared no está instalado. Instálalo con: winget install Cloudflare.cloudflared'
  }

  Paso 'Abriendo túneles de Cloudflare'
  Remove-Item "$logs\tunel-*.log" -ErrorAction SilentlyContinue
  # http2 evita los fallos de QUIC en redes que bloquean UDP
  Start-Process cloudflared -ArgumentList 'tunnel', '--protocol', 'http2', '--url', 'http://localhost:3001' `
    -RedirectStandardError "$logs\tunel-backend.log" -RedirectStandardOutput "$logs\tunel-backend.out" -WindowStyle Hidden
  Start-Process cloudflared -ArgumentList 'tunnel', '--protocol', 'http2', '--url', 'http://localhost:3000' `
    -RedirectStandardError "$logs\tunel-frontend.log" -RedirectStandardOutput "$logs\tunel-frontend.out" -WindowStyle Hidden

  $urlBack  = Esperar-Url "$logs\tunel-backend.log"
  $urlFront = Esperar-Url "$logs\tunel-frontend.log"
  if (-not $urlBack -or -not $urlFront) { Falla "No se obtuvieron las URLs de los túneles. Revisa los logs en $logs" }
  Write-Host "  Backend : $urlBack"
  Write-Host "  Frontend: $urlFront"

  Paso 'Actualizando .env'
  Set-EnvVar $envBack 'CORS_ORIGIN' "$corsLocal,$urlFront"
  Set-EnvVar $envFront 'NEXT_PUBLIC_API_URL' "$urlBack/api"
} else {
  Paso 'Actualizando .env (modo local)'
  Set-EnvVar $envBack 'CORS_ORIGIN' $corsLocal
  Set-EnvVar $envFront 'NEXT_PUBLIC_API_URL' $apiLocal
}

Paso 'Arrancando backend'
Start-Process node -ArgumentList 'src/server.js' -WorkingDirectory $backend `
  -RedirectStandardOutput "$logs\backend.out" -RedirectStandardError "$logs\backend.err" -WindowStyle Hidden
if (-not (Esperar-Http 'http://localhost:3001/api/health' 40)) { Falla "El backend no responde. Revisa $logs\backend.err" }

Paso 'Compilando frontend (puede tardar un minuto)'
Push-Location $frontend
try {
  & pnpm build
  if ($LASTEXITCODE -ne 0) { Falla 'La compilación del frontend falló.' }
} finally { Pop-Location }

Paso 'Arrancando frontend'
Start-Process cmd -ArgumentList '/c', 'pnpm start' -WorkingDirectory $frontend `
  -RedirectStandardOutput "$logs\frontend.out" -RedirectStandardError "$logs\frontend.err" -WindowStyle Hidden
if (-not (Esperar-Http 'http://localhost:3000' 40)) { Falla "El frontend no responde. Revisa $logs\frontend.err" }

if (-not $Local) {
  Paso 'Comprobando los túneles'
  $okBack  = Esperar-Http "$urlBack/api/health" 40
  $okFront = Esperar-Http $urlFront 40
  if (-not $okBack)  { Write-Host '  AVISO: el túnel del backend aún no responde (puede tardar unos segundos).' -ForegroundColor Yellow }
  if (-not $okFront) { Write-Host '  AVISO: el túnel del frontend aún no responde (puede tardar unos segundos).' -ForegroundColor Yellow }
  Set-Clipboard -Value $urlFront -ErrorAction SilentlyContinue
  Write-Host "`nListo. URL para compartir (copiada al portapapeles):" -ForegroundColor Green
  Write-Host "  $urlFront" -ForegroundColor Green
} else {
  Write-Host "`nListo. Abre http://localhost:3000" -ForegroundColor Green
}
Write-Host "Logs: $logs"
Write-Host 'Para apagar todo: .\compartir.ps1 -Detener   (o doble clic en detener.cmd)'
