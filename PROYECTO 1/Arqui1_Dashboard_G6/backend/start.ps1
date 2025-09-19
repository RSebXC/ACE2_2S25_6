# Script de inicio para Backend Python
Write-Host "Iniciando Backend Python para Dashboard de Sensores..." -ForegroundColor Green
Write-Host ""

# Verificar si Python está instalado
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Python encontrado: $pythonVersion" -ForegroundColor Yellow
} catch {
    Write-Host "Error: Python no está instalado o no está en el PATH" -ForegroundColor Red
    Write-Host "Por favor instala Python 3.8 o superior" -ForegroundColor Red
    Read-Host "Presiona Enter para continuar"
    exit 1
}

# Verificar si pip está instalado
try {
    $pipVersion = pip --version 2>&1
    Write-Host "pip encontrado: $pipVersion" -ForegroundColor Yellow
} catch {
    Write-Host "Error: pip no está instalado" -ForegroundColor Red
    Read-Host "Presiona Enter para continuar"
    exit 1
}

Write-Host ""
Write-Host "Instalando dependencias..." -ForegroundColor Yellow
pip install -r requirements.txt

Write-Host ""
Write-Host "Iniciando servidor..." -ForegroundColor Green
python app.py

Read-Host "Presiona Enter para continuar"
