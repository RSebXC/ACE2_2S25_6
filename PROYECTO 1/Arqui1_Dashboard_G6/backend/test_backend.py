import requests
import json
import time

def test_backend():
    """Script para probar el backend Python"""
    base_url = "http://localhost:4000"
    
    print("🧪 Iniciando pruebas del Backend Python...")
    print("=" * 50)
    
    # Test 1: Health Check
    print("\n1️⃣ Probando endpoint de salud...")
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health check exitoso")
            print(f"   Respuesta: {response.json()}")
        else:
            print(f"❌ Health check falló - Status: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Error de conexión en health check: {e}")
        print("   ¿Está ejecutándose el servidor Python?")
        return
    
    # Test 2: Sensor Data Endpoints
    sensors = ['temperature', 'humidity', 'light', 'pressure', 'air', 'presence']
    
    print("\n2️⃣ Probando endpoints de datos de sensores...")
    for sensor in sensors:
        print(f"\n   Probando sensor: {sensor}")
        try:
            response = requests.get(f"{base_url}/api/sensordata?sensor={sensor}", timeout=10)
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ {sensor}: {len(data)} registros obtenidos")
                if data:
                    print(f"      Campos disponibles: {list(data[0].keys())}")
                else:
                    print("      (Sin datos en la base de datos)")
            else:
                print(f"   ❌ {sensor}: Error {response.status_code}")
                try:
                    error_msg = response.json().get('error', 'Error desconocido')
                    print(f"      Error: {error_msg}")
                except:
                    print(f"      Respuesta: {response.text}")
        except requests.exceptions.RequestException as e:
            print(f"   ❌ {sensor}: Error de conexión - {e}")
    
    # Test 3: Invalid sensor
    print("\n3️⃣ Probando sensor inválido...")
    try:
        response = requests.get(f"{base_url}/api/sensordata?sensor=invalid", timeout=5)
        if response.status_code == 400:
            print("✅ Manejo correcto de sensor inválido")
            print(f"   Error: {response.json().get('error')}")
        else:
            print(f"❌ Respuesta inesperada para sensor inválido: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Error de conexión: {e}")
    
    # Test 4: Missing sensor parameter
    print("\n4️⃣ Probando parámetro sensor faltante...")
    try:
        response = requests.get(f"{base_url}/api/sensordata", timeout=5)
        if response.status_code == 400:
            print("✅ Manejo correcto de parámetro faltante")
            print(f"   Error: {response.json().get('error')}")
        else:
            print(f"❌ Respuesta inesperada para parámetro faltante: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Error de conexión: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Pruebas completadas")
    print("\n💡 Si todas las pruebas son exitosas, el backend está listo para usar!")
    print("   Puedes iniciar el frontend React con: cd Frontend && npm start")

if __name__ == "__main__":
    test_backend()
