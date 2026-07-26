<#
.SYNOPSIS
    Build Perch for Windows, as an installer you can hand to someone else.

.DESCRIPTION
    Builds for the MSVC target on purpose. On the GNU toolchain `webview2-com`
    cannot link the WebView2 loader statically, so the executable imports
    WebView2Loader.dll at runtime. Cargo drops that DLL next to the binary — so
    the build runs fine on the machine that produced it — but the installer does
    not carry it, and on anyone else's computer the app dies before it starts:

        "система не обнаружила WebView2Loader.dll"

    MSVC links it statically and the DLL is not needed at all.

    Requires: Visual Studio Build Tools (MSVC) and Node.js. Pass -Gnu to build
    with the GNU toolchain instead — fine for local use, not for distribution.
#>

param(
    # Build with the GNU toolchain. Needs MinGW at C:\mingw64 for windres, and
    # produces a binary that will not run on another machine without the DLL.
    [switch]$Gnu
)

$ErrorActionPreference = "Stop"
$ProjectDir = $PSScriptRoot | Split-Path -Parent
$CargoBin = "$env:USERPROFILE\.cargo\bin"
$env:CARGO_TARGET_DIR = "C:\perch-target"

$Target = if ($Gnu) { "x86_64-pc-windows-gnu" } else { "x86_64-pc-windows-msvc" }

if ($Gnu) {
    $MingwBin = "C:\mingw64\mingw64\bin"
    $env:PATH = "$MingwBin;$CargoBin;$env:PATH"

    # windres — which tauri-winres shells out to for the Windows resource —
    # cannot open files under a path containing non-ASCII characters. It fails
    # with "can't open icon file: Invalid argument", which is easy to misread as
    # a problem with the icon itself. MSVC has no such trouble.
    if ($ProjectDir -notmatch '^[\x20-\x7E]+$') {
        Write-Host "ERROR: the project path contains non-ASCII characters:" -ForegroundColor Red
        Write-Host "  $ProjectDir" -ForegroundColor Red
        Write-Host ""
        Write-Host "GNU windres cannot read files through such a path, so the Windows" -ForegroundColor Yellow
        Write-Host "resource (app icon, version info) cannot be compiled. Move the project" -ForegroundColor Yellow
        Write-Host "somewhere ASCII-only, or drop -Gnu and build with MSVC." -ForegroundColor Yellow
        exit 1
    }

    Write-Host "WARNING: a GNU build needs WebView2Loader.dll beside the exe." -ForegroundColor Yellow
    Write-Host "         The installer does not include it. Do not distribute this." -ForegroundColor Yellow
} else {
    $env:PATH = "$CargoBin;$env:PATH"
}

Write-Host "=== Perch build ($Target) ===" -ForegroundColor Cyan

Write-Host "`n[1/2] Rust target..." -ForegroundColor Yellow
& "$CargoBin\rustup.exe" target add $Target 2>&1 | Out-Null
Write-Host "$Target ready" -ForegroundColor Green

# The frontend is built by tauri itself, via beforeBuildCommand in
# tauri.conf.json, so there is no separate step for it here.
Write-Host "`n[2/2] Building (5-15 min the first time)..." -ForegroundColor Yellow
Set-Location $ProjectDir
& npx tauri build --target $Target 2>&1 | ForEach-Object { Write-Host $_ }

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n=== BUILD FAILED ===" -ForegroundColor Red
    exit 1
}

$OutDir = "C:\perch-target\$Target\release"

Write-Host "`n=== BUILD COMPLETE ===" -ForegroundColor Green
$nsis = Get-ChildItem "$OutDir\bundle\nsis\*.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($nsis) { Write-Host "Installer: $($nsis.FullName)" -ForegroundColor Cyan }
$msi = Get-ChildItem "$OutDir\bundle\msi\*.msi" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($msi) { Write-Host "MSI:       $($msi.FullName)" -ForegroundColor Cyan }
if (Test-Path "$OutDir\perch.exe") { Write-Host "Portable:  $OutDir\perch.exe" -ForegroundColor Cyan }

# Catch the mistake this script exists to prevent, rather than trusting it.
if (Test-Path "$OutDir\WebView2Loader.dll") {
    Write-Host "`nNOTE: WebView2Loader.dll sits next to the binary, so this build" -ForegroundColor Yellow
    Write-Host "      needs it at runtime and the installer does not ship it." -ForegroundColor Yellow
    Write-Host "      Build without -Gnu before giving this to anyone." -ForegroundColor Yellow
}
