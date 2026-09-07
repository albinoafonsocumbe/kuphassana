# ================================================
# Plataforma Funeraria — Iniciar Backend + Frontend
# ================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor DarkGray
Write-Host "  Plataforma Funeraria — Iniciando..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor DarkGray
Write-Host ""

# Backend
Write-Host "1. A iniciar Backend (porta 3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 3

# Frontend
Write-Host "2. A iniciar Frontend (porta 5500)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npx serve . -p 5500" -WindowStyle Normal

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "========================================" -ForegroundColor DarkGray
Write-Host "  TUDO A FUNCIONAR!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Backend  -> http://localhost:3000" -ForegroundColor White
Write-Host "  Frontend -> http://localhost:5500" -ForegroundColor White
Write-Host ""
Write-Host "  Contas de teste:" -ForegroundColor DarkGray
Write-Host "  Cliente   -> maria@teste.pt / 123456" -ForegroundColor Gray
Write-Host "  Prestador -> costa@funeraria.pt / 123456" -ForegroundColor Gray
Write-Host "  Admin     -> admin@plataforma.pt / password" -ForegroundColor Gray
Write-Host ""

# Abrir browser automaticamente
Start-Sleep -Seconds 2
Start-Process "http://localhost:5500"
