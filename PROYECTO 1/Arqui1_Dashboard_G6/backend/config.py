import os

class Config:
    """Configuración del backend Python"""
    
    # MongoDB Configuration
    MONGODB_URI = os.getenv(
        'MONGODB_URI', 
        "mongodb+srv://arqui1:arqui1@cluster0.5qycha1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    )
    MONGODB_DB = os.getenv('MONGODB_DB', 'mydatabase')
    MONGODB_COLLECTION = os.getenv('MONGODB_COLLECTION', 'lecturas_sensores')
    
    # Server Configuration
    PORT = int(os.getenv('PORT', 4000))
    HOST = os.getenv('HOST', '0.0.0.0')
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
    
    # CORS Configuration
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*')
    
    # Sensor Mapping
    SENSOR_MAP = {
        "temperature": "temperatura",
        "humidity": "humedad", 
        "light": "iluminacion",
        "pressure": "presion",
        "air": "calidad_de_aire",
        "presence": "distancia"
    }
    
    # Query Configuration
    MAX_DOCUMENTS = int(os.getenv('MAX_DOCUMENTS', 30))
