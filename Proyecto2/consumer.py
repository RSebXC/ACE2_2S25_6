import paho.mqtt.client as mqtt
import json
from google.cloud import firestore
import datetime

# Inicializar Firestore
db = firestore.Client()

# Callback cuando se recibe un mensaje
def on_message(client, userdata, msg):
    topic = msg.topic
    payload = json.loads(msg.payload.decode())
    collection = topic.split('/')[1]  # Extrae el tipo de sensor del topic
    data = {
        "valor": payload.get("value"),
        "unidad": payload.get("unit", ""),
        "fecha_hora": datetime.datetime.utcnow().isoformat()
    }
    db.collection(collection).add(data)

# Configuración del cliente MQTT
client = mqtt.Client()
client.on_message = on_message
client.connect("localhost", 1883)
client.subscribe("silo/sensores/#")

# Iniciar el loop
client.loop_forever()