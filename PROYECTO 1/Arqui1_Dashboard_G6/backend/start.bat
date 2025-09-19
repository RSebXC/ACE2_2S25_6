@echo off
echo Iniciando Backend Python para Dashboard de Sensores...
echo.

REM Verificar si Python está instalado
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python no está instalado o no está en el PATH
    echo Por favor instala Python 3.8 o superior
    pause
    exit /b 1
)

REM Verificar si pip está instalado
pip --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: pip no está instalado
    pause
    exit /b 1
)

echo Instalando dependencias...
pip install -r requirements.txt

echo.
echo Iniciando servidor...
python app.py

pause
