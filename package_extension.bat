@echo off
setlocal

:: Get timestamp using PowerShell
for /f "delims=" %%i in ('powershell -Command "Get-Date -Format 'yyyyMMdd_HHmmss'"') do set TIMESTAMP=%%i
set ZIP_NAME=howler_%TIMESTAMP%.zip

echo Packaging extension into %ZIP_NAME%...
echo Ensuring Firefox compatibility (forward slashes and root structure)...

:: Staging
if exist zip_staging rd /s /q zip_staging
mkdir zip_staging

:: Copy files (exactly matching the structure Firefox requires)
xcopy /E /I /Y "icons" "zip_staging\icons" >nul
xcopy /E /I /Y "lib" "zip_staging\lib" >nul
copy "manifest.json" "zip_staging\" >nul
copy "popup.html" "zip_staging\" >nul
copy "popup.js" "zip_staging\" >nul
copy "content.js" "zip_staging\" >nul
copy "background.js" "zip_staging\" >nul
copy "styles.css" "zip_staging\" >nul
copy ".gitignore" "zip_staging\" >nul
copy "README.md" "zip_staging\" >nul

:: Use PowerShell to zip with forward slashes (Self-Contained)
powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; $zip = [System.IO.Compression.ZipFile]::Open('%ZIP_NAME%', 'Create'); $source = (Get-Item 'zip_staging').FullName; $files = Get-ChildItem -Path $source -Recurse | Where-Object { -not $_.PSIsContainer }; foreach ($file in $files) { $rel = $file.FullName.Substring($source.Length + 1).Replace('\', '/'); [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $rel, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null }; $zip.Dispose()"

:: Clean up
rd /s /q zip_staging

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] Created %ZIP_NAME%
    echo All files are at the root with forward slashes for Firefox.
) else (
    echo.
    echo [ERROR] Failed to create ZIP file.
)

pause
