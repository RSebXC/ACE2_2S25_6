from fastapi import FastAPI
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import paho.mqtt.client as mqtt
import json
from datetime import datetime
import threading

app = FastAPI()

# Conexión a PostgreSQL (usa las credenciales de tu docker-compose)
DATABASE_URL = "postgresql://hydroguard_user:hydroguard_password@postgres:5432/hydroguard"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Función para insertar en tablas específicas
def insert_into_db(table, values):
    db = SessionLocal()
    try:
        placeholders = ", ".join([f":{key}" for key in values.keys()])
        columns = ", ".join(values.keys())
        query = text(f"INSERT INTO {table} ({columns}) VALUES ({placeholders})")
        db.execute(query, values)
        db.commit()
    except Exception as e:
        print(f"Error inserting into {table}: {e}")
    finally:
        db.close()

# MQTT callbacks
def on_connect(client, userdata, flags, rc):
    print("Connected to MQTT")
    client.subscribe("silo/sensores/#")
    client.subscribe("silo/sistema/estado")
    client.subscribe("silo/sistema/evento")
    client.subscribe("silo/bomba/estado")
    client.subscribe("silo/modo/estado")
    client.subscribe("silo/alarma/estado")

def on_message(client, userdata, msg):
    topic = msg.topic
    payload = msg.payload.decode()
    timestamp = datetime.utcnow()

    if topic == "silo/sensores/nivel":
        insert_into_db("nivel_liquido", {"valor": float(payload), "fecha_hora": timestamp})
    elif topic == "silo/sensores/temp_liquido":
        insert_into_db("temperatura_liquido", {"valor": float(payload), "fecha_hora": timestamp})
    elif topic == "silo/sensores/temp_ambiente":
        insert_into_db("temperatura_ambiente", {"valor": float(payload), "fecha_hora": timestamp})
    elif topic == "silo/sensores/humedad":
        insert_into_db("humedad", {"valor": float(payload), "fecha_hora": timestamp})
    elif topic == "silo/sensores/tiempo_llenado":
        insert_into_db("tiempo_llenado", {"valor": float(payload), "fecha_hora": timestamp})
    elif topic == "silo/sistema/evento":
        insert_into_db("eventos_sistema", {"tipo_evento": "EVENTO", "descripcion": payload, "fecha_hora": timestamp})
    elif topic == "silo/sistema/estado":
        try:
            data = json.loads(payload)
            insert_into_db("estados_bomba", {
                "estado": data.get("bomba", "OFF"),
                "modo": data.get("modo", "AUTO"),
                "emergencia": data.get("emergencia", False),
                "alarma": data.get("alarma", False),
                "fecha_hora": timestamp
            })
        except json.JSONDecodeError:
            print("Error parsing JSON for estado")

# Iniciar MQTT en un thread
mqtt_client = mqtt.Client()
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message
mqtt_client.connect("mosquitto", 1883, 60)
threading.Thread(target=mqtt_client.loop_forever, daemon=True).start()

# Endpoint para históricos (para el frontend)
@app.get("/historical/{table}")
def get_historical(table: str):
    db = SessionLocal()
    try:
        records = db.execute(text(f"SELECT * FROM {table} ORDER BY fecha_hora DESC LIMIT 100")).fetchall()
        return [{"id": r[0], "valor": r[1], "fecha_hora": r[3]} if table in ["nivel_liquido", "temperatura_liquido", "temperatura_ambiente", "humedad", "tiempo_llenado"] else r for r in records]
    finally:
        db.close()