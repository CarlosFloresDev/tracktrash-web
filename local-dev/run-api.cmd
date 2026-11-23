@echo off
rem Runs a READ-ONLY copy of the backend (Luladusilva/TrackTrash) against the local database.
rem The backend repository itself is never modified: this builds from a separate clone.
set NUGET_PACKAGES=D:\DevTools\nuget-packages
set DOTNET_CLI_HOME=D:\DevTools\Temp\dotnethome
set ASPNETCORE_ENVIRONMENT=Development
set ASPNETCORE_URLS=http://localhost:5145
set ConnectionStrings__DefaultConnection=Host=localhost;Port=54329;Database=tracktrash_db;Username=postgres
set Jwt__Key=local-development-key-with-at-least-32-characters-long
if "%BACKEND_DIR%"=="" set BACKEND_DIR=D:\DevTools\tracktrash-backend-ref
dotnet run --project "%BACKEND_DIR%\TrackTrashAPI" --no-launch-profile
