# Manual de usuarios para mulas

En el archivo PROYECTO está todo, la forma en que el arduino le manda los datos al ESP32  es con este código:

```ino
 // ---- Enviar frame CSV a ESP32 ----
  // Usa tus variables locales calculadas en la función
  Serial1.print("D,");                       // etiqueta Data
  Serial1.print(distance, 1); Serial1.print(',');
  Serial1.print(isnan(tempAir) ? NAN : tempAir, 2); Serial1.print(',');
  Serial1.print(isnan(hum) ? NAN : hum, 1);  Serial1.print(',');
  Serial1.println(tempWater, 2);             // fin de línea
```

Está al final del modo manual y el modo automatico, por el momento solo está suscrito a un broker públic y conectado al wifi de mi casa.

Los datos que envían por el momento por si quieren ir haciendo la base, los canales y la info para el frontend son los siguientes:

- Distancia
- Temperatura
- Humedad
- Temperatura del agua

```
(enviando líneas D,dist,temp,hum,tempAgua por Serial1)
```
Lo que a mí me muestra en consola es lo siguiente:

```bash
julio/sensores D,71.5,24.80,77.0,23.50
julio/prueba Hola desde ESP32
```
Y con este comando me suscribo a todos los canales

```bash
mosquitto_sub -h test.mosquitto.org -t 'julio/#' -v
```

en el archivo del ESP32 van a ver esto:

```ino

/* ====== MQTT público (Mosquitto) ====== */
const char* MQTT_HOST = "test.mosquitto.org";
const uint16_t MQTT_PORT = 1883;

/* ====== Topics ====== */
const char* TOPIC_BASE   = "julio";
const char* TOPIC_PUB    = "julio/prueba";     // ping de prueba cada 5 s
const char* TOPIC_DATA   = "julio/sensores";   // lo que llegue del Mega por Serial2
const char* TOPIC_CMD    = "julio/cmd";        // comandos hacia el Mega
const char* TOPIC_STATUS = "julio/status";     // LWT/estado

```
## MQTT
son los canales/topicos a los que me suscribo, el que va a hacer mqtt tiene que dejarlos así tal cual solo que en vez de julio le ponen otro nombre va.

## BASE DE DATOS
Quien vaya a hacer la base de datos debe almacenar lo anteriormente mencionado
- Distancia
- Temperatura
- Humedad
- Temperatura del agua

## FRONTEND
Debe dejar lindos los apartados para que se muestren los datos

## API
debe dejar los endpoints para que le entren los datos, ya sea desde el broker o desde la db, no sé como va ese flujo.