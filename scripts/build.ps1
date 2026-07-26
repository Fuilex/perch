<#
.SYNOPSIS
    Build Perch desktop app for Windows.
    Requires: MinGW at C:\mingw64, Rust GNU toolchain, Node.js.
#>

$ErrorActionPreference = "Stop"
$ProjectDir = $PSScriptRoot | Split-Path -Parent
$MingwBin = "C:\mingw64\mingw64\bin"
$CargoBin = "$env:USERPROFILE\.cargo\bin"
$env:PATH = "$MingwBin;$CargoBin;$env:PATH"
$env:CARGO_TARGET_DIR = "C:\perch-target"

# windres — which tauri-winres shells out to for the Windows resource — cannot
# open files under a path containing non-ASCII characters. It fails with
# "can't open icon file: Invalid argument", which is easy to misread as a
# problem with the icon itself.
if ($ProjectDir -notmatch '^[\x20-\x7E]+$') {
    Write-Host "ERROR: the project path contains non-ASCII characters:" -ForegroundColor Red
    Write-Host "  $ProjectDir" -ForegroundColor Red
    Write-Host ""
    Write-Host "GNU windres cannot read files through such a path, so the Windows" -ForegroundColor Yellow
    Write-Host "resource (app icon, version info) cannot be compiled. Move the project" -ForegroundColor Yellow
    Write-Host "somewhere ASCII-only — C:\perch, for example — and run this again." -ForegroundColor Yellow
    exit 1
}

Write-Host "=== Perch Build ===" -ForegroundColor Cyan

# 1. Frontend
Write-Host "`n[1/3] Building frontend..." -ForegroundColor Yellow
Set-Location $ProjectDir
npm run build
if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }
Write-Host "Frontend OK" -ForegroundColor Green

# 2. Set Rust toolchain
Write-Host "`n[2/3] Configuring Rust toolchain..." -ForegroundColor Yellow
& "$CargoBin\rustup.exe" default stable-x86_64-pc-windows-gnu 2>&1 | Out-Null
Write-Host "Rust GNU toolchain active" -ForegroundColor Green

# 3. Tauri build
Write-Host "`n[3/3] Building Tauri app (this takes 5-15 min first time)..." -ForegroundColor Yellow
Set-Location "$ProjectDir\src-tauri"
& "$CargoBin\cargo.exe" tauri build 2>&1 | ForEach-Object { Write-Host $_ }

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n=== BUILD COMPLETE ===" -ForegroundColor Green
    $nsis = Get-ChildItem "C:\perch-target\release\bundle\nsis\*.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($nsis) { Write-Host "Installer: $($nsis.FullName)" -ForegroundColor Cyan }
    $exe = "C:\perch-target\release\perch.exe"
    if (Test-Path $exe) { Write-Host "Portable:  $exe" -ForegroundColor Cyan }
} else {
    Write-Host "`n=== BUILD FAILED ===" -ForegroundColor Red
    exit 1
}
