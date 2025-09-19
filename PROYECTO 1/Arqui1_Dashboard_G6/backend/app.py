from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import json
import logging
from config import Config

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=Config.CORS_ORIGINS)

# Configuración desde config.py
config = Config()

@app.route('/api/sensordata', methods=['GET'])
def get_sensor_data():
    """
    Endpoint para obtener datos de sensores desde MongoDB
    Parámetros:
    - sensor: tipo de sensor (temperature, humidity, light, pressure, air, presence)
    """
    sensor = request.args.get('sensor')
    
    if not sensor:
        return jsonify({'error': 'Parámetro sensor requerido'}), 400
    
    field = config.SENSOR_MAP.get(sensor)
    if not field:
        return jsonify({'error': 'Sensor inválido'}), 400

    try:
        # Conectar a MongoDB
        client = MongoClient(config.MONGODB_URI)
        db = client[config.MONGODB_DB]
        collection = db[config.MONGODB_COLLECTION]

        # Traer los últimos documentos que tengan el campo solicitado
        cursor = collection.find(
            {field: {"$exists": True}}
        ).sort("_id", -1).limit(config.MAX_DOCUMENTS)
        
        docs = list(cursor)

        # Eliminar el campo _id y dejar solo los campos relevantes
        result = []
        for doc in docs:
            if '_id' in doc:
                del doc['_id']
            result.append(doc)

        logger.info(f"Datos enviados al dashboard: {json.dumps(result, indent=2, default=str)}")
        
        # Cerrar conexión
        client.close()
        
        return jsonify(result)

    except Exception as err:
        logger.error(f"Error al obtener datos: {err}")
        return jsonify({'error': 'Error al obtener datos'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Endpoint para verificar el estado del servidor"""
    return jsonify({'status': 'ok', 'message': 'Backend Python funcionando correctamente'})

if __name__ == '__main__':
    print(f"Backend Python escuchando en http://{config.HOST}:{config.PORT}")
    app.run(host=config.HOST, port=config.PORT, debug=config.DEBUG)
