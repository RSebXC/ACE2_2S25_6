# Dashboard de Sensores - Arqui1 Frontend F2

Sistema de dashboard para monitoreo de sensores IoT con backend migrado a Python.

## Estructura del Proyecto

```
├── backend/           # Backend en Python (Flask) + respaldo JavaScript
│   ├── app.py        # Aplicación principal en Python
│   ├── requirements.txt
│   ├── start.bat     # Script de inicio para Windows
│   ├── start.ps1     # Script de inicio para PowerShell
│   ├── README.md
│   └── getSensorData.js.backup  # Respaldo del backend original en Node.js
├── Frontend/         # Frontend en React
│   ├── src/
│   ├── public/
│   └── package.json
```

## Características

- **Backend migrado a Python**: Ahora utiliza Flask en lugar de Node.js/Express
- **Misma funcionalidad**: Todos los endpoints y respuestas mantienen la misma estructura
- **Conexión a MongoDB**: Mantenida desde el backend original
- **Frontend sin cambios**: React sigue funcionando sin modificaciones
- **Soporte para sensores**: temperature, humidity, light, pressure, air, presence

## Configuración y Ejecución

### Backend (Python)

1. **Prerrequisitos**:
   - Python 3.8 o superior
   - pip (gestor de paquetes de Python)

2. **Instalación y ejecución**:
   ```bash
   cd backend
   
   # Instalar dependencias
   pip install -r requirements.txt
   
   # Ejecutar servidor
   python app.py
   ```

   **Opciones alternativas para Windows**:
   ```bash
   # Usando batch script
   start.bat
   
   # Usando PowerShell script
   powershell -ExecutionPolicy Bypass -File start.ps1
   
   # Usando npm (si tienes Node.js instalado)
   npm run start
   ```

3. **Verificación**: El servidor estará disponible en `http://localhost:4000`

### Frontend (React)

1. **Instalación**:
   ```bash
   cd Frontend
   npm install
   ```

2. **Ejecución**:
   ```bash
   npm start
   ```

3. **Acceso**: La aplicación estará disponible en `http://localhost:3000`

## Endpoints del Backend

### GET /api/sensordata
Obtiene datos históricos de sensores desde MongoDB.

**Parámetros**:
- `sensor`: Tipo de sensor (temperature, humidity, light, pressure, air, presence)

**Ejemplo**:
```
GET http://localhost:4000/api/sensordata?sensor=temperature
```

### GET /health
Verifica el estado del servidor Python.

## Migración Realizada

### ✅ Completado
- ✅ Backend convertido de JavaScript (Node.js/Express) a Python (Flask)
- ✅ Mantenida toda la funcionalidad original
- ✅ Mismo endpoint y estructura de respuesta
- ✅ Conexión a MongoDB preservada
- ✅ Frontend funcionando sin cambios
- ✅ Scripts de inicio para Windows
- ✅ Documentación actualizada

### 🔧 Archivos Modificados
- `backend/app.py` - Nuevo backend en Python
- `backend/requirements.txt` - Dependencias de Python
- `backend/package.json` - Actualizado con scripts para Python
- `frontend/src/pages/Dashboard.js` - Comentarios actualizados
- `backend/getSensorData.js` → `getSensorData.js.backup` - Respaldo del código original

## Sensores Soportados

| Sensor | Parámetro | Campo MongoDB |
|--------|-----------|---------------|
| Temperatura | `temperature` | `temperatura` |
| Humedad | `humidity` | `humedad` |
| Iluminación | `light` | `iluminacion` |
| Presión | `pressure` | `presion` |
| Calidad del Aire | `air` | `calidad_de_aire` |
| Presencia/Distancia | `presence` | `distancia` |

## Base de Datos

- **Tipo**: MongoDB Atlas
- **Base de datos**: mydatabase
- **Colección**: lecturas_sensores
- **Conexión**: Mantenida desde la configuración original

## Notas de Desarrollo

- El backend Python mantiene la misma API REST que el original en JavaScript
- No se requieren cambios en el frontend React
- El archivo JavaScript original se mantiene como respaldo
- Todos los scripts de inicio están configurados para Windows
- Las dependencias de Python están especificadas en `requirements.txt`
