; Perch NSIS Installer Script
; Run: makensis installer.nsi

!define APP_NAME "Perch"
!define APP_VERSION "0.1.0"
!define APP_PUBLISHER "Fuilex"
!define APP_URL "https://github.com/fuilex/perch"
!define APP_EXE "perch.exe"
!define OUTPUT_EXE "Perch-0.1.0-Setup.exe"
!define SOURCE_EXE "C:\perch-target\release\perch.exe"
!define ICON_FILE "C:\perch-icons\icon.ico"

Name "${APP_NAME} ${APP_VERSION}"
OutFile "${OUTPUT_EXE}"
InstallDir "$LOCALAPPDATA\Programs\Perch"
InstallDirRegKey HKCU "Software\Fuilex\Perch" "InstallDir"
RequestExecutionLevel user
SetCompressor /SOLID lzma

!include "MUI2.nsh"

!define MUI_ABORTWARNING
!define MUI_ICON "${ICON_FILE}"
!define MUI_UNICON "${ICON_FILE}"
!define MUI_WELCOMEPAGE_TITLE "Welcome to Perch ${APP_VERSION}"
!define MUI_WELCOMEPAGE_TEXT "Perch is a local file automation tool that keeps your files organized.$\n$\nClick Next to continue."

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

Section "Main Application" SEC_MAIN
  SetOutPath "$INSTDIR"
  File "${SOURCE_EXE}"

  ; Create shortcuts
  CreateDirectory "$SMPROGRAMS\Perch"
  CreateShortcut "$SMPROGRAMS\Perch\Perch.lnk" "$INSTDIR\${APP_EXE}" "" "${ICON_FILE}"
  CreateShortcut "$DESKTOP\Perch.lnk" "$INSTDIR\${APP_EXE}" "" "${ICON_FILE}"

  ; Registry
  WriteRegStr HKCU "Software\Fuilex\Perch" "InstallDir" "$INSTDIR"
  WriteRegStr HKCU "Software\Fuilex\Perch" "Version" "${APP_VERSION}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Perch" "DisplayName" "${APP_NAME}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Perch" "DisplayVersion" "${APP_VERSION}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Perch" "Publisher" "${APP_PUBLISHER}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Perch" "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Perch" "DisplayIcon" "$INSTDIR\${APP_EXE}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Perch" "URLInfoAbout" "${APP_URL}"

  WriteUninstaller "$INSTDIR\Uninstall.exe"
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\${APP_EXE}"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
  Delete "$SMPROGRAMS\Perch\Perch.lnk"
  RMDir "$SMPROGRAMS\Perch"
  Delete "$DESKTOP\Perch.lnk"
  DeleteRegKey HKCU "Software\Fuilex\Perch"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Perch"
SectionEnd
