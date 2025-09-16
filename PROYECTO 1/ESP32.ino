#include <WiFi.h>
#include <PubSubClient.h>

/* ====== Wi-Fi ====== */
const char* WIFI_SSID = "JAMZ";
const char* WIFI_PASS = "F4MP31UCH3";

/* ====== MQTT público (Mosquitto) ====== */
const char* MQTT_HOST = "test.mosquitto.org";
const uint16_t MQTT_PORT = 1883;

/* ====== Topics ====== */
const char* TOPIC_BASE   = "julio";
const char* TOPIC_PUB    = "julio/prueba";     // ping de prueba cada 5 s
const char* TOPIC_DATA   = "julio/sensores";   // lo que llegue del Mega por Serial2
const char* TOPIC_CMD    = "julio/cmd";        // comandos hacia el Mega
const char* TOPIC_STATUS = "julio/status";     // LWT/estado

/* ====== UART hacia Mega ====== */
#define RX2_PIN 16  // ESP32 RX2  ← Mega TX1 (18) con divisor
#define TX2_PIN 17  // ESP32 TX2  → Mega RX1 (19) directo

#ifndef LED_BUILTIN
#define LED_BUILTIN 2  // en muchos WROOM el LED controlable es GPIO2 (si no, prueba 5)
#endif

WiFiClient wifiClient;
PubSubClient mqtt(wifiClient);

/* ====== Utils ====== */
String uniqueClientId() {
  uint8_t mac[6]; WiFi.macAddress(mac);
  char buf[40];
  snprintf(buf, sizeof(buf), "ESP32Julio-%02X%02X%02X", mac[3], mac[4], mac[5]);
  return String(buf);
}

void mqttCallback(char* topic, byte* payload, unsigned int len) {
  // Reenviar comandos al Mega (texto plano, termina en \n)
  String msg; msg.reserve(len);
  for (unsigned int i=0;i<len;i++) msg += (char)payload[i];
  msg.trim();
  Serial.printf("[MQTT][%s] %s\n", topic, msg.c_str());
  if (String(topic) == TOPIC_CMD) {
    Serial2.println(msg);
  }
}

void connectWifi() {
  if (WiFi.status() == WL_CONNECTED) return;
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.printf("WiFi: conectando a %s", WIFI_SSID);
  while (WiFi.status() != WL_CONNECTED) {
    delay(400); Serial.print('.');
  }
  Serial.printf("\nWiFi OK. IP: %s\n", WiFi.localIP().toString().c_str());
}

void connectMqtt() {
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setCallback(mqttCallback);

  String cid = uniqueClientId();
  Serial.printf("MQTT: conectando a %s como %s\n", MQTT_HOST, cid.c_str());

  while (!mqtt.connected()) {
    // LWT: si el ESP32 cae, broker publicará "offline" en julio/status
    if (mqtt.connect(cid.c_str(), nullptr, nullptr, TOPIC_STATUS, 0, false, "offline")) {
      Serial.println("MQTT conectado");
      mqtt.publish(TOPIC_STATUS, "online", false);
      mqtt.subscribe(TOPIC_CMD);
    } else {
      Serial.printf("Fallo rc=%d, reintento en 2s\n", mqtt.state());
      delay(2000);
    }
  }
}

void setup() {
  Serial.begin(115200);                          // monitor del ESP32
  Serial2.begin(115200, SERIAL_8N1, RX2_PIN, TX2_PIN);
  pinMode(LED_BUILTIN, OUTPUT); digitalWrite(LED_BUILTIN, LOW);

  connectWifi();
  connectMqtt();
}

void loop() {
  // mantener conexiones
  if (WiFi.status() != WL_CONNECTED) connectWifi();
  if (!mqtt.connected()) connectMqtt();
  mqtt.loop();

  // 1) Publicación de latido cada 5 s
  static unsigned long lastPing = 0;
  if (millis() - lastPing >= 5000) {
    lastPing = millis();
    mqtt.publish(TOPIC_PUB, "Hola desde ESP32");
    Serial.println("[PUB] julio/prueba -> Hola desde ESP32");
  }

  // 2) Leer líneas del Mega por Serial2 y publicarlas
  if (Serial2.available()) {
    String line = Serial2.readStringUntil('\n');
    line.trim();
    if (line.length()) {
      mqtt.publish(TOPIC_DATA, line.c_str(), false);
      digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN)); // toggle en cada publicación
      Serial.printf("[PUB] %s -> %s\n", TOPIC_DATA, line.c_str());
    }
  }

  // (Opcional) puente PC->Mega para depurar
  while (Serial.available()) Serial2.write(Serial.read());
}
