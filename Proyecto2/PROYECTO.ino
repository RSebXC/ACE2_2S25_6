//  === HECHO POR JULIO :) ===
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// --- Pines ---
#define TRIG_PIN 9
#define ECHO_PIN 8
#define DHT_PIN 7
#define DHTTYPE DHT11
#define RELAY_PIN 6
#define DS18B20_PIN 2   // Pin de datos de la sonda

// --- Objetos ---
LiquidCrystal_I2C lcd(0x27, 16, 2);
DHT dht(DHT_PIN, DHTTYPE);
OneWire oneWire(DS18B20_PIN);
DallasTemperature sensors(&oneWire);

// --- Variables ---
unsigned long lastPageChange = 0;
int currentPage = 0; // 0 = DHT+ultra, 1 = DS18B20

// --- Botones ---
//boton de emergencia
int boton = 13;
//boton para vaciar la bomba en modo manual
int boton_2 = 5;

int estado = 0;
int estado_2 = 0;

//para escoger el modo
int interruptor = 3;
int interruptor_boton = 0;
int buzzer = 10;
// ====================================== SETUP ============================================
void setup() {

  // al inicio del setup()
  Serial1.begin(115200);      // TX1=18, RX1=19 hacia el ESP32
  Serial1.setTimeout(5);


  lcd.init();
  lcd.backlight();
  
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(RELAY_PIN, OUTPUT);

  // --- Botones ---
  pinMode(boton, INPUT_PULLUP);
  pinMode(boton_2, INPUT_PULLUP);  // Activa resistencia interna pull-up
  pinMode(buzzer, OUTPUT);
  pinMode(interruptor, INPUT_PULLUP);
  Serial.begin(9600);

  dht.begin();
  sensors.begin();

  lcd.setCursor(0,0);
  lcd.print("Iniciando...");
  delay(2000);


}
// ====================================== MAIN LOOP ============================================
void loop() {
  estado = digitalRead(boton);
  if(estado == HIGH){
      interruptor_boton = digitalRead(interruptor);
      switch (interruptor_boton) {
        case LOW: modoAutomatico();
        break;
        case HIGH: modoManual();
        break;
        default:
        break;
    }
  }else{
    modoEmergencia();
  }
  
}
// ====================================== AUTOMATICO ============================================
void modoAutomatico(){
  // --- Lectura ultrasonico ---
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  long duration = pulseIn(ECHO_PIN, HIGH);
  float distance = duration * 0.034 / 2; // cm

  // --- Control bomba ---
  if(distance < 6){
    digitalWrite(RELAY_PIN, LOW);
    digitalWrite(buzzer, HIGH);
  } else if(distance > 13){
    digitalWrite(RELAY_PIN, HIGH);
    digitalWrite(buzzer, LOW);
  }

  // --- Lectura DHT11 ---
  float tempAir = dht.readTemperature();
  float hum = dht.readHumidity();

  // --- Lectura DS18B20 ---
  sensors.requestTemperatures();
  float tempWater = sensors.getTempCByIndex(0);

  // --- Cambiar página cada 3 segundos ---
  if (millis() - lastPageChange > 3000) {
    currentPage = (currentPage + 1) % 3; // alterna entre 0 y 1
    lastPageChange = millis();
  }

  // --- Mostrar en LCD ---
  lcd.clear();
  if (currentPage == 0) {
    // Página 1: distancia + DHT11
    lcd.setCursor(0,0);
    lcd.print("Dist:");
    lcd.print(distance);
    lcd.print("cm");

    lcd.setCursor(0,1);
    lcd.print("T:");
    if (isnan(tempAir)) lcd.print("Err");
    else {
      lcd.print(tempAir);
      lcd.print("C ");
    }

    lcd.print("H:");
    if (isnan(hum)) lcd.print("Err");
    else {
      lcd.print(hum);
      lcd.print("%");
    }

  } else if(currentPage == 1){
    // Página 2: DS18B20
    lcd.setCursor(0,0);
    lcd.print("Temp Agua:");

    lcd.setCursor(0,1);
    if (tempWater == DEVICE_DISCONNECTED_C) {
      lcd.print("Error sensor");
    } else {
      lcd.print(tempWater);
      lcd.print((char)223); // símbolo de grados
      lcd.print("C");
    }
  }else if(currentPage == 2){
    lcd.setCursor(0, 0);
    lcd.print("Modo Automatico");
  }

    // ---- Enviar frame CSV a ESP32 ----
  // Usa tus variables locales calculadas en la función
  Serial1.print("D,");                       // etiqueta Data
  Serial1.print(distance, 1); Serial1.print(',');
  Serial1.print(isnan(tempAir) ? NAN : tempAir, 2); Serial1.print(',');
  Serial1.print(isnan(hum) ? NAN : hum, 1);  Serial1.print(',');
  Serial1.println(tempWater, 2);             // fin de línea


  delay(200); // pequeño delay para estabilidad
}
// ====================================== MANUAL ============================================
void modoManual(){
  // --- Lectura ultrasonico ---
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  long duration = pulseIn(ECHO_PIN, HIGH);
  float distance = duration * 0.034 / 2; // cm

  // --- Control bomba ---
  estado_2 = digitalRead(boton_2);
  if(estado_2 == LOW){
    digitalWrite(RELAY_PIN, LOW);
  } else {
    digitalWrite(RELAY_PIN, HIGH);
  }

  // --- Lectura DHT11 ---
  float tempAir = dht.readTemperature();
  float hum = dht.readHumidity();

  // --- Lectura DS18B20 ---
  sensors.requestTemperatures();
  float tempWater = sensors.getTempCByIndex(0);

  // --- Cambiar página cada 3 segundos ---
  if (millis() - lastPageChange > 3000) {
    currentPage = (currentPage + 1) % 3; // alterna entre 0 y 1
    lastPageChange = millis();
  }

  // --- Mostrar en LCD ---
  lcd.clear();
  if (currentPage == 0) {
    // Página 1: distancia + DHT11
    lcd.setCursor(0,0);
    lcd.print("Dist:");
    lcd.print(distance);
    lcd.print("cm");

    lcd.setCursor(0,1);
    lcd.print("T:");
    if (isnan(tempAir)) lcd.print("Err");
    else {
      lcd.print(tempAir);
      lcd.print("C ");
    }

    lcd.print("H:");
    if (isnan(hum)) lcd.print("Err");
    else {
      lcd.print(hum);
      lcd.print("%");
    }

  } else if(currentPage == 1){
    // Página 2: DS18B20
    lcd.setCursor(0,0);
    lcd.print("Temp Agua:");

    lcd.setCursor(0,1);
    if (tempWater == DEVICE_DISCONNECTED_C) {
      lcd.print("Error sensor");
    } else {
      lcd.print(tempWater);
      lcd.print((char)223); // símbolo de grados
      lcd.print("C");
    }
  }else if(currentPage == 2){
    lcd.setCursor(0, 0);
    lcd.print("Modo Manual");
  }

    // ---- Enviar frame CSV a ESP32 ----
  // Usa tus variables locales calculadas en la función
  Serial1.print("D,");                       // etiqueta Data
  Serial1.print(distance, 1); Serial1.print(',');
  Serial1.print(isnan(tempAir) ? NAN : tempAir, 2); Serial1.print(',');
  Serial1.print(isnan(hum) ? NAN : hum, 1);  Serial1.print(',');
  Serial1.println(tempWater, 2);             // fin de línea


  delay(200); // pequeño delay para estabilidad

}
// ====================================== EMERGENCIA ============================================
void modoEmergencia(){
  static unsigned long lastBlink = 0;
  static bool buzzerState = false;
  static bool toggleMessage = false;

  // --- Apagar bomba sí o sí ---
  digitalWrite(RELAY_PIN, LOW);

  // --- Parpadeo del buzzer cada 500 ms ---
  if (millis() - lastBlink > 500) {
    buzzerState = !buzzerState;
    digitalWrite(buzzer, buzzerState ? HIGH : LOW);
    toggleMessage = !toggleMessage; // alternar mensaje en pantalla
    lastBlink = millis();
  }

  // --- Mensaje de emergencia en LCD ---
  lcd.clear();
  lcd.setCursor(0, 0);
  if (toggleMessage) {
    lcd.print("!!! EMERGENCIA !!!");
  } else {
    lcd.print("Revisar sistema");
  }
  lcd.setCursor(0, 1);
  lcd.print("Sensores OFF");

  delay(200); // estabilidad pequeña
}
