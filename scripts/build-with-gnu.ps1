# This script sets up MinGW and runs tauri build via GNU toolchain.
# Run after MinGW is extracted to C:\mingw64\

$mingwBin = "C:\mingw64\mingw64\bin"
$cargoBin = "$env:USERPROFILE\.cargo\bin"

if (-not (Test-Path "$mingwBin\gcc.exe")) {
    Write-Host "ERROR: MinGW not found at $mingwBin" -ForegroundColor Red
    exit 1
}

# Set default Rust toolchain to GNU
$env:PATH = "$mingwBin;$cargoBin;$env:PATH"
& "$cargoBin\rustup.exe" default stable-x86_64-pc-windows-gnu
Write-Host "Rust toolchain set to GNU"

# Run cargo check first
Set-Location "c:\Users\serge\OneDrive\Рабочий стол\perch-0.1\src-tauri"
Write-Host "Running cargo check..."
& "$cargoBin\cargo.exe" check 2>&1 | Select-Object -Last 10

if ($LASTEXITCODE -eq 0) {
    Write-Host "cargo check OK! Starting tauri build..." -ForegroundColor Green
    Set-Location "c:\Users\serge\OneDrive\Рабочий стол\perch-0.1"
    & "$cargoBin\cargo.exe" tauri build 2>&1 | Tee-Object -FilePath "build.log"
} else {
    Write-Host "cargo check FAILED" -ForegroundColor Red
}
