# Backend en Python para Dashboard de Sensores

Este backend está desarrollado en Python usando Flask y MongoDB para manejar los datos de sensores.

## Configuración

### Prerrequisitos
- Python 3.8 o superior
- pip (gestor de paquetes de Python)

### Instalación

1. Instalar las dependencias:
```bash
pip install -r requirements.txt
```

### Ejecución

1. Ejecutar el servidor:
```bash
python app.py
```

2. Probar el servidor:
```bash
python test_backend.py
```

El servidor estará disponible en `http://localhost:4000`

## Endpoints Disponibles

### GET /api/sensordata
Obtiene los datos de sensores desde MongoDB.

**Parámetros de consulta:**
- `sensor`: Tipo de sensor (temperature, humidity, light, pressure, air, presence)

**Ejemplo:**
```
GET http://localhost:4000/api/sensordata?sensor=temperature
```

### GET /health
Verifica el estado del servidor.

**Ejemplo:**
```
GET http://localhost:4000/health
```

## Sensores Soportados

- `temperature` → campo `temperatura` en MongoDB
- `humidity` → campo `humedad` en MongoDB  
- `light` → campo `iluminacion` en MongoDB
- `pressure` → campo `presion` en MongoDB
- `air` → campo `calidad_de_aire` en MongoDB
- `presence` → campo `distancia` en MongoDB

## Archivos Principales

- `app.py` - Aplicación Flask principal
- `config.py` - Configuración centralizada
- `requirements.txt` - Dependencias de Python
- `test_backend.py` - Script de pruebas
- `.env.example` - Ejemplo de variables de entorno
- `start.bat` / `start.ps1` - Scripts de inicio para Windows

## Configuración Avanzada

### Variables de Entorno
Puedes crear un archivo `.env` basado en `.env.example` para personalizar la configuración:

```bash
cp .env.example .env
# Editar .env con tus valores
```

### Pruebas
Para verificar que el backend funciona correctamente:

```bash
# En una terminal, inicia el servidor
python app.py

# En otra terminal, ejecuta las pruebas
python test_backend.py
```

## Base de Datos

El backend se conecta a MongoDB Atlas usando la siguiente configuración:
- URI: mongodb+srv://arqui1:arqui1@cluster0.5qycha1.mongodb.net/
- Base de datos: mydatabase
- Colección: lecturas_sensores
