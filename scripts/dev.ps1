<#
.SYNOPSIS
    Run Perch in development mode.
    Requires: MinGW at C:\mingw64, Rust GNU toolchain, Node.js.

    Vite is started by Tauri itself (beforeDevCommand in tauri.conf.json), so
    this only sets up the toolchain and hands over.
#>

$ErrorActionPreference = "Stop"
$ProjectDir = $PSScriptRoot | Split-Path -Parent
$MingwBin = "C:\mingw64\mingw64\bin"
$CargoBin = "$env:USERPROFILE\.cargo\bin"

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

if (-not (Test-Path "$MingwBin\windres.exe")) {
    Write-Host "ERROR: MinGW not found at $MingwBin" -ForegroundColor Red
    Write-Host "Install it, or switch to the MSVC toolchain." -ForegroundColor Yellow
    exit 1
}

$env:PATH = "$MingwBin;$CargoBin;$env:PATH"
$env:CARGO_TARGET_DIR = "C:\perch-target"

Write-Host "=== Perch (dev) ===" -ForegroundColor Cyan
& "$CargoBin\rustup.exe" default stable-x86_64-pc-windows-gnu 2>&1 | Out-Null

Set-Location $ProjectDir
& "$CargoBin\cargo.exe" tauri dev
