import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Chart from 'chart.js/auto';
import '../styles/Dashboard.css';
import mqtt from 'mqtt';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// NOTA: Este frontend ahora se conecta al backend en Python (Flask)
// que reemplaza el backend anterior en Node.js/Express
// El endpoint y estructura de datos permanecen iguales: http://localhost:4000/api/sensordata

// Add Toast component to show alerts
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    // Configuramos un temporizador para cerrar automáticamente la alerta después de 5 segundos
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // 5000 milisegundos = 5 segundos
    
    // Limpiamos el temporizador cuando el componente se desmonte o cuando cambie onClose
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast ${type}`}>
      <div className="toast-content">{message}</div>
      <button className="toast-close" onClick={onClose}>✖</button>
    </div>
  );
};

// Topics MQTT del enunciado
const TOPICS = {
  sistema: {
    estado: 'silo/sistema/estado',
    evento: 'silo/sistema/evento'
  },
  bomba: {
    estado: 'silo/bomba/estado',
    control: 'silo/bomba/control'
  },
  emergencia: {
    control: 'silo/emergencia/control'
  },
  modo: {
    estado: 'silo/modo/estado',
    control: 'silo/modo/control'
  },
  alarma: {
    estado: 'silo/alarma/estado',
    control: 'silo/alarma/control'
  },
  sensores: {
    nivel: 'silo/sensores/nivel',
    tempLiquido: 'silo/sensores/temp_liquido',
    tempAmbiente: 'silo/sensores/temp_ambiente',
    humedad: 'silo/sensores/humedad',
    tiempoLlenado: 'silo/sensores/tiempo_llenado'
  }
};

const Dashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState('panel1');
  const chartRef = useRef(null);
  const historyChartRef = useRef(null);
  const mqttClientRef = useRef(null);
  const lastSentMessageRef = useRef({ topic: '', message: '', timestamp: 0 });
  const [sensorData, setSensorData] = useState({
    nivel: { value: '0 %', data: [] },
    temp_liquido: { value: '25.0 °C', data: [] },
    temp_ambiente: { value: '25.0 °C', data: [] },
    humedad: { value: '50 %', data: [] },
    tiempo_llenado: { value: '0 s', data: [] }
  });
  const [currentSensor, setCurrentSensor] = useState('nivel');
  const [timeLabels, setTimeLabels] = useState(Array.from({length: 21}, (_, i) => `${20 - i}s`));
  const [lastSensorValues, setLastSensorValues] = useState({});
  // Add state for toast notifications
  const [toasts, setToasts] = useState([]);

  // Add state for LCD display modes
  const [lcdDisplayMode, setLcdDisplayMode] = useState({
    'realtime': false,
    'statistics': false, 
    'predictions': false
  });

  // Add state for statistics and predictions results
  const [statisticsResults, setStatisticsResults] = useState({
    media: '0',
    mediana: '0',
    moda: '0',
    minMax: '0 / 0',
    desviacion: '0',
    varianza: '0'
  });
  const [predictionResults, setpredictionResults] = useState({
    ma: 'No hay datos disponibles',
    ses: 'No hay datos disponibles'
  });
  const [selectedStatSensor, setSelectedStatSensor] = useState('temperature');
  
  // Estado para los datos de la tabla solicitada
  const [tableData, setTableData] = useState([]);
  const [tableSensor, setTableSensor] = useState('temperature');
  const [tableLoading, setTableLoading] = useState(false);

  // Function to show toast notifications
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  // Function to remove a toast
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Initialize the MQTT connection, chart, and actuator controls on component mount
  useEffect(() => {
    initializeChart();
    configurarConexionMQTT();
    initializeActuatorControls();
    
    return () => {
      // Cleanup on component unmount
      if (historyChartRef.current) {
        historyChartRef.current.destroy();
      }
      
      if (mqttClientRef.current) {
        mqttClientRef.current.end();
      }
    };
  }, []);

  // Configure MQTT connection
  const configurarConexionMQTT = () => {
    const brokerUrl = 'wss://broker.emqx.io:8084/mqtt'; // Secure WebSocket endpoint
    console.log('Conectando al broker MQTT');

    const options = {
      keepalive: 60,
      clientId: 'webclient_' + Math.random().toString(16).substr(2, 8),
      protocolId: 'MQTT',
      protocolVersion: 4,
      clean: true,
      reconnectPeriod: 1000,
      connectTimeout: 30 * 1000
    };

    mqttClientRef.current = mqtt.connect(brokerUrl, options);

    mqttClientRef.current.on('connect', function() {
      console.log('Conectado al broker MQTT');

      // Suscribirse a los topics del sistema y sensores
      const topicsToSubscribe = [
        TOPICS.sistema.estado,
        TOPICS.sistema.evento,
        TOPICS.bomba.estado,
        TOPICS.modo.estado,
        TOPICS.alarma.estado,
        TOPICS.sensores.nivel,
        TOPICS.sensores.tempLiquido,
        TOPICS.sensores.tempAmbiente,
        TOPICS.sensores.humedad,
        TOPICS.sensores.tiempoLlenado
      ];

      topicsToSubscribe.forEach(topic => {
        mqttClientRef.current.subscribe(topic, function(err) {
          if (!err) {
            console.log(`Suscrito a: ${topic}`);
          } else {
            console.error(`Error al suscribirse a ${topic}:`, err);
          }
        });
      });
    });

    mqttClientRef.current.on('message', function(topic, message) {
      const messageStr = message.toString();
      console.log(`Mensaje recibido en ${topic}: ${messageStr}`);

      // Eventos del sistema -> mostrar como toasts
      if (topic === TOPICS.sistema.evento) {
        try {
          const evt = JSON.parse(messageStr);
          const text = evt.text || evt.mensaje || evt.evento || messageStr;
          const sev = (evt.tipo || evt.severidad || 'info').toString().toLowerCase();
          const type = ['error','warning','success','info'].includes(sev) ? sev : 'info';
          showToast(text, type);
        } catch {
          showToast(messageStr, 'info');
        }
        return;
      }

      // Estado general del sistema
      if (topic === TOPICS.sistema.estado || topic === TOPICS.modo.estado) {
        try {
          const st = JSON.parse(messageStr);
          // Actualizar modo automático
          if (st.modo) {
            setActuatorStates(prev => ({ ...prev, auto: st.modo.toString().toLowerCase() === 'automatico' }));
          }
          if (typeof st.alarma !== 'undefined') {
            setActuatorStates(prev => ({ ...prev, alarma: !!st.alarma }));
          }
          if (typeof st.emergencia !== 'undefined') {
            setActuatorStates(prev => ({ ...prev, emergencia_activa: !!st.emergencia }));
          }
        } catch (e) {
          console.warn('No se pudo parsear estado del sistema/modo:', e);
        }
        return;
      }

      // Estado de bomba / alarma
      if (topic === TOPICS.bomba.estado) {
        const on = /on/i.test(messageStr) || messageStr === '1' || messageStr === 'true';
        setActuatorStates(prev => ({ ...prev, bomba: on }));
        return;
      }
      if (topic === TOPICS.alarma.estado) {
        const on = /on/i.test(messageStr) || messageStr === '1' || messageStr === 'true';
        setActuatorStates(prev => ({ ...prev, alarma: on }));
        return;
      }

      // Procesamiento de sensores
      let value = messageStr;
      const numberPattern = /(\d+(\.\d+)?)/;
      const matches = messageStr.match(numberPattern);
      if (matches && matches.length > 0) {
        value = parseFloat(matches[0]);
      } else {
        const numValue = parseFloat(messageStr);
        if (!isNaN(numValue)) value = numValue;
      }

      let sensorType = null;
      if (topic === TOPICS.sensores.nivel || topic.includes('/nivel')) {
        sensorType = 'nivel';
      } else if (topic === TOPICS.sensores.tempLiquido || topic.includes('/temp_liquido')) {
        sensorType = 'temp_liquido';
      } else if (topic === TOPICS.sensores.tempAmbiente || topic.includes('/temp_ambiente')) {
        sensorType = 'temp_ambiente';
      } else if (topic === TOPICS.sensores.humedad || topic.includes('/humedad')) {
        sensorType = 'humedad';
      } else if (topic === TOPICS.sensores.tiempoLlenado || topic.includes('/tiempo_llenado')) {
        sensorType = 'tiempo_llenado';
      }

      if (sensorType) {
        try {
          actualizarVisualizacionSensor(sensorType, value);
        } catch (error) {
          console.error(`Error al actualizar visualización para ${sensorType}:`, error);
        }
        return;
      }
    });

    mqttClientRef.current.on('error', function(error) {
      console.error('Error de conexión MQTT:', error);
    });
    mqttClientRef.current.on('offline', function() {
      console.log('Cliente MQTT desconectado');
    });
    mqttClientRef.current.on('reconnect', function() {
      console.log('Cliente MQTT intentando reconectar');
    });
  };

  // Publicación con control de duplicados
  const publishMqttMessage = (topic, message) => {
    if (!mqttClientRef.current || !mqttClientRef.current.connected) {
      console.error('Cliente MQTT no conectado');
      return false;
    }
    
    // Check if this is a duplicate message within 500ms
    const now = Date.now();
    const lastSent = lastSentMessageRef.current;
    if (lastSent.topic === topic && 
        lastSent.message === message && 
        now - lastSent.timestamp < 500) {
      console.log('Mensaje duplicado detectado, ignorando:', message);
      return false;
    }
    
    // Update the last sent message reference
    lastSentMessageRef.current = {
      topic,
      message,
      timestamp: now
    };
    
    console.log(`Publicando en ${topic}: ${message}`);
    mqttClientRef.current.publish(topic, message, { qos: 0, retain: false }, function(err) {
      if (err) {
        console.error('Error al publicar:', err);
        return false;
      } else {
        console.log('Mensaje publicado correctamente');
        return true;
      }
    });
  };
  
  // Initialize chart for historical data
  const initializeChart = () => {
    const ctx = document.getElementById('historyChart')?.getContext('2d');
    if (!ctx) return;

    const generateRandomData = (count, min, max, isInteger = false) => {
      return Array.from({length: count}, () => {
        const value = Math.random() * (max - min) + min;
        return isInteger ? Math.round(value) : parseFloat(value.toFixed(1));
      });
    };

    const dataConfig = {
      nivel: {
        label: 'Nivel (%)',
        data: generateRandomData(20, 10, 90),
        color: 'rgba(54, 162, 235, 1)',
        bgColor: 'rgba(54, 162, 235, 0.2)'
      },
      temp_liquido: {
        label: 'Temp. Líquido (°C)',
        data: generateRandomData(20, 20, 35),
        color: 'rgba(255, 99, 132, 1)',
        bgColor: 'rgba(255, 99, 132, 0.2)'
      },
      temp_ambiente: {
        label: 'Temp. Ambiente (°C)',
        data: generateRandomData(20, 18, 32),
        color: 'rgba(255, 159, 64, 1)',
        bgColor: 'rgba(255, 159, 64, 0.2)'
      },
      humedad: {
        label: 'Humedad (%)',
        data: generateRandomData(20, 40, 70),
        color: 'rgba(75, 192, 192, 1)',
        bgColor: 'rgba(75, 192, 192, 0.2)'
      },
      tiempo_llenado: {
        label: 'Tiempo hasta llenado (s)',
        data: generateRandomData(20, 10, 120, true),
        color: 'rgba(153, 102, 255, 1)',
        bgColor: 'rgba(153, 102, 255, 0.2)'
      }
    };

    chartRef.current = dataConfig;

    const chartConfig = {
      type: 'line',
      data: {
        labels: timeLabels,
        datasets: [{
          label: dataConfig.nivel.label,
          data: dataConfig.nivel.data,
          borderColor: dataConfig.nivel.color,
          backgroundColor: dataConfig.nivel.bgColor,
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#fff' } } },
        scales: {
          x: { grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: '#aaa' } },
          y: { grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: '#aaa' } }
        }
      }
    };

    historyChartRef.current = new Chart(ctx, chartConfig);
  };

  // Update sensor visualization with real data
  const actualizarVisualizacionSensor = (sensorType, data) => {
    try {
      let value;
      if (typeof data === 'object' && data.value !== undefined) value = data.value; else value = data;
      if (typeof value === 'string') {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) value = numValue;
      }

      let formattedValue;
      let unit;
      switch(sensorType) {
        case 'nivel':
          formattedValue = typeof value === 'number' ? Math.round(value) : value;
          unit = ' %';
          break;
        case 'temp_liquido':
        case 'temp_ambiente':
          formattedValue = typeof value === 'number' ? value.toFixed(1) : value;
          unit = ' °C';
          break;
        case 'humedad':
          formattedValue = typeof value === 'number' ? Math.round(value) : value;
          unit = ' %';
          break;
        case 'tiempo_llenado':
          formattedValue = typeof value === 'number' ? Math.round(value) : value;
          unit = ' s';
          break;
        default:
          formattedValue = value;
          unit = '';
      }

      setSensorData(prevData => ({
        ...prevData,
        [sensorType]: {
          value: `${formattedValue}${unit}`,
          data: [...(prevData[sensorType]?.data || [])]
        }
      }));

      if (typeof value === 'number') {
        updateHistoricalData(sensorType, value);
      }
    } catch (error) {
      console.error("Error actualizando visualización del sensor:", error);
    }
  };

  // Update chart with new data
  const updateChart = (sensor) => {
    if (!historyChartRef.current || !chartRef.current) return;
    
    const dataConfig = chartRef.current[sensor];
    historyChartRef.current.data.datasets[0].label = dataConfig.label;
    historyChartRef.current.data.datasets[0].data = dataConfig.data;
    historyChartRef.current.data.datasets[0].borderColor = dataConfig.color;
    historyChartRef.current.data.datasets[0].backgroundColor = dataConfig.bgColor;
    historyChartRef.current.update();
  };

  // Initialize actuator controls
  const initializeActuatorControls = () => {
    // This is handled by React state and event handlers in the toggleActuator function
  };
  
  // Handle LCD display mode toggle with mutual exclusion
  const toggleLcdMode = (mode) => {
    setLcdDisplayMode(prev => {
      const newState = {
        'realtime': false,
        'statistics': false,
        'predictions': false
      };
      
      // If the clicked mode was already active, we're turning it off - all modes can be off
      // Otherwise, we're turning this mode on and all others off
      if (!prev[mode]) {
        newState[mode] = true;
      }
      
      // Send MQTT message for the LCD display mode
      const jsonCommand = JSON.stringify({
        actuator: 'lcd',
        mode: mode,
        state: newState[mode].toString()
      });
      publishMqttMessage('GRUPO18/control/rasp01/commands', jsonCommand);
      
      return newState;
    });
  };

  // Update historical data with new values
  const updateHistoricalData = (sensorType, newValue) => {
    if (!chartRef.current) return;
    
    // Remove oldest value and add new
    chartRef.current[sensorType].data.shift();
    chartRef.current[sensorType].data.push(newValue);
    
    // If this is the currently displayed sensor, update the chart
    if (currentSensor === sensorType && historyChartRef.current) {
      updateChart(sensorType);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleTabClick = (panelId) => {
    setActivePanel(panelId);
  };

  const handleSensorSelect = (sensor) => {
    setCurrentSensor(sensor);
    // When explicitly selecting a sensor, update the chart
    updateChart(sensor);
  };

  // Estados y controles de actuadores acorde al enunciado
  const [actuatorStates, setActuatorStates] = useState({
    auto: false,
    bomba: false,
    alarma: false,
    emergencia_activa: false
  });

  const toggleActuator = (id) => {
    setActuatorStates(prev => {
      const newState = { ...prev };

      // Reglas por actuador
      if (id === 'auto') {
        const willBeAuto = !prev.auto;
        newState.auto = willBeAuto;
        const payload = JSON.stringify({ accion: willBeAuto ? 'AUTOMATICO' : 'MANUAL' });
        publishMqttMessage(TOPICS.modo.control, payload);
        // Si activamos automático, no controlamos manualmente la bomba/alarma
      } else if (id === 'bomba') {
        if (prev.auto) {
          showToast('Cambie a modo MANUAL para controlar la bomba', 'warning');
          return prev;
        }
        const willOn = !prev.bomba;
        newState.bomba = willOn;
        const payload = JSON.stringify({ accion: willOn ? 'ON' : 'OFF' });
        publishMqttMessage(TOPICS.bomba.control, payload);
      } else if (id === 'alarma') {
        if (prev.auto) {
          showToast('La alarma se controla automáticamente. Solo se puede desactivar en MANUAL.', 'info');
          return prev;
        }
        // Solo se permite desactivar según enunciado
        if (prev.alarma) {
          const payload = JSON.stringify({ accion: 'OFF' });
          publishMqttMessage(TOPICS.alarma.control, payload);
          newState.alarma = false;
        } else {
          showToast('La alarma solo puede desactivarse (OFF) desde el control', 'info');
          return prev;
        }
      }

      return newState;
    });
  };

  const activarEmergencia = () => {
    publishMqttMessage(TOPICS.emergencia.control, JSON.stringify({ accion: 'ON' }));
    showToast('Parada de emergencia enviada', 'warning');
  };

  // Handle calculation request (no topics definidos en el enunciado)
  const handleCalculateRequest = () => {
    showToast('Cálculos no configurados en los topics del enunciado', 'info');
  };

  // Add content for new panels
  const renderEstadisticasPredicciones = () => {
    return (
      <div className="statistics-predictions">
        <div className="control-panel">
          <div className="sensor-selection">
            <select 
              id="stat-sensor-select" 
              value={selectedStatSensor}
              onChange={(e) => setSelectedStatSensor(e.target.value)}
              className="sensor-dropdown"
            >
              <option value="temperature">Temperatura</option>
              <option value="humidity">Humedad</option>
              <option value="light">Iluminación</option>
              <option value="pressure">Presión</option>
              <option value="air">Calidad de Aire</option>
              <option value="presence">Distancia</option>
            </select>
            <button className="calculate-btn" onClick={handleCalculateRequest}>Calcular</button>
          </div>
        </div>
        
        <div className="results-container">
          <div className="stat-block">
            <h3>Estadísticas</h3>
            <div className="stat-results">
              <div className="stat-result-item">
                <label>Media:</label>
                <input type="text" disabled value={statisticsResults.media} className="result-display" />
              </div>
              <div className="stat-result-item">
                <label>Mediana:</label>
                <input type="text" disabled value={statisticsResults.mediana} className="result-display" />
              </div>
              <div className="stat-result-item">
                <label>Moda:</label>
                <input type="text" disabled value={statisticsResults.moda} className="result-display" />
              </div>
              <div className="stat-result-item">
                <label>Mínimo / Máximo:</label>
                <input type="text" disabled value={statisticsResults.minMax} className="result-display" />
              </div>
              <div className="stat-result-item">
                <label>Desviación estándar:</label>
                <input type="text" disabled value={statisticsResults.desviacion} className="result-display" />
              </div>
              <div className="stat-result-item">
                <label>Varianza:</label>
                <input type="text" disabled value={statisticsResults.varianza} className="result-display" />
              </div>
            </div>
          </div>
          
          <div className="prediction-block">
            <h3>Modelos de Predicción</h3>
            <div className="prediction-results">
              <div className="prediction-result-item">
                <label>Media Móvil (MA):</label>
                <textarea 
                  disabled 
                  className="prediction-display"
                  value={predictionResults.ma}
                />
              </div>
              <div className="prediction-result-item">
                <label>Suavizado Exponencial (SES):</label>
                <textarea 
                  disabled 
                  className="prediction-display"
                  value={predictionResults.ses}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Nueva función para solicitar datos al backend Python (Flask)
  const handleTableRequest = async () => {
    setTableLoading(true);
    try {
      const sensor = tableSensor;
      // Llamada al backend Python en lugar del backend Node.js original
      const response = await fetch(`http://localhost:4000/api/sensordata?sensor=${sensor}`);
      const data = await response.json();
      setTableData(data);
      console.log("Datos recibidos del backend Python:", data);
    } catch (err) {
      showToast('Error al obtener datos de la base de datos', 'error');
      setTableData([]);
    }
    setTableLoading(false);
  };

  // Exportar a Excel
  const exportToExcel = () => {
    if (!tableData.length) return;
    const ws = XLSX.utils.json_to_sheet(tableData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Datos");
    XLSX.writeFile(wb, "datos_sensores.xlsx");
  };

  // Exportar a PDF
  const exportToPDF = () => {
    if (!tableData.length) return;
    const doc = new jsPDF();
    const columns = Object.keys(tableData[0] || {});
    const rows = tableData.map(row => columns.map(col => row[col]));
    doc.autoTable({
      head: [columns],
      body: rows,
      styles: { fontSize: 9 }
    });
    doc.save("datos_sensores.pdf");
  };

  // Modificar renderTablaSolicitar para eliminar selección de sensor y rango de tiempo
  const renderTablaSolicitar = () => {
    // Obtener columnas dinámicamente
    const columns = tableData.length ? Object.keys(tableData[0]) : [];
    return (
      <div className="table-request">
        {/* Eliminado: controles de selección de sensor y rango de tiempo */}
        <button
          className="request-btn"
          onClick={handleTableRequest}
          disabled={tableLoading}
          style={{ marginBottom: '10px', background: 'linear-gradient(90deg, #00a4a2 0%, #00fffc 100%)', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '5px', padding: '10px 22px', fontSize: '1rem', cursor: 'pointer' }}
        >
          {tableLoading ? "Cargando..." : "Solicitar Datos"}
        </button>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map(col => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length}>No hay datos</td>
                </tr>
              ) : (
                tableData.map((row, idx) => (
                  <tr key={idx}>
                    {columns.map(col => (
                      <td key={col}>{row[col]}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="export-controls">
          <button className="export-btn" onClick={exportToExcel} disabled={!tableData.length}>Exportar a Excel</button>
          <button className="export-btn" onClick={exportToPDF} disabled={!tableData.length}>Exportar a PDF</button>
        </div>
      </div>
    );
  };

  return (
    <div className="container">
      {/* Toast container */}
      <div id="toast-container">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
      
      <header>
        {/*<h1>Módulos Principales</h1>*/}
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activePanel === 'panel1' ? 'active' : ''}`} 
            onClick={() => handleTabClick('panel1')}
          >
            Panel General
          </button>
          <button 
            className={`tab-button ${activePanel === 'panel2' ? 'active' : ''}`} 
            onClick={() => handleTabClick('panel2')}
          >
            Reporte Histórico
          </button>
          <button 
            className={`tab-button ${activePanel === 'panel3' ? 'active' : ''}`} 
            onClick={() => handleTabClick('panel3')}
          >
            Control Remoto
          </button>
          <button 
            className={`tab-button ${activePanel === 'panel4' ? 'active' : ''}`} 
            onClick={() => handleTabClick('panel4')}
          >
            Estadisticas-Predicciones
          </button>
          <button 
            className={`tab-button ${activePanel === 'panel5' ? 'active' : ''}`} 
            onClick={() => handleTabClick('panel5')}
          >
            Tabla a solicitar
          </button>
          <button 
            className="tab-button logout-btn" 
            onClick={handleLogout}
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main>
        {/* Panel 1: Datos en tiempo real */}
        <div className={`panel ${activePanel === 'panel1' ? 'active' : ''}`} id="panel1">
          <h2>Datos de Sensores en Tiempo Real</h2>
          <div className="sensor-grid">
            {/* Nivel */}
            <div className="sensor-card">
              <div className="sensor-icon">🧪</div>
              <div className="sensor-data">
                <span className="sensor-value" id="nivel-value">{sensorData.nivel.value}</span>
                <span className="sensor-label">Nivel</span>
              </div>
            </div>

            {/* Temp Líquido */}
            <div className="sensor-card">
              <div className="sensor-icon temperature-icon">🌡️</div>
              <div className="sensor-data">
                <span className="sensor-value" id="templ-value">{sensorData.temp_liquido.value}</span>
                <span className="sensor-label">Temp. Líquido</span>
              </div>
            </div>

            {/* Temp Ambiente */}
            <div className="sensor-card">
              <div className="sensor-icon temperature-icon">🌡️</div>
              <div className="sensor-data">
                <span className="sensor-value" id="tempa-value">{sensorData.temp_ambiente.value}</span>
                <span className="sensor-label">Temp. Ambiente</span>
              </div>
            </div>

            {/* Humedad */}
            <div className="sensor-card">
              <div className="sensor-icon humidity-icon">💧</div>
              <div className="sensor-data">
                <span className="sensor-value" id="humedad-value">{sensorData.humedad.value}</span>
                <span className="sensor-label">Humedad</span>
              </div>
            </div>

            {/* Tiempo de llenado */}
            <div className="sensor-card">
              <div className="sensor-icon">⏱️</div>
              <div className="sensor-data">
                <span className="sensor-value" id="tiempo-value">{sensorData.tiempo_llenado.value}</span>
                <span className="sensor-label">Tiempo hasta llenado</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: Reporte histórico */}
        <div className={`panel ${activePanel === 'panel2' ? 'active' : ''}`} id="panel2">
          <h2>Reporte Histórico</h2>
          <div className="chart-container">
            <canvas id="historyChart"></canvas>
          </div>
          <div className="chart-controls">
            <button className="chart-btn" onClick={() => handleSensorSelect('nivel')}>Nivel</button>
            <button className="chart-btn" onClick={() => handleSensorSelect('temp_liquido')}>Temp. Líquido</button>
            <button className="chart-btn" onClick={() => handleSensorSelect('temp_ambiente')}>Temp. Ambiente</button>
            <button className="chart-btn" onClick={() => handleSensorSelect('humedad')}>Humedad</button>
            <button className="chart-btn" onClick={() => handleSensorSelect('tiempo_llenado')}>Tiempo Llenado</button>
          </div>
        </div>

        {/* Panel 3: Control remoto */}
        <div className={`panel ${activePanel === 'panel3' ? 'active' : ''}`} id="panel3">
          <h2>Control Remoto</h2>
          <div className="actuator-grid">
            {/* Modo Automático/Manual */}
            <div className="actuator-card">
              <span className="actuator-label">Modo Automático</span>
              <div className={`actuator-status ${actuatorStates.auto ? 'on' : 'off'}`}>
                ⚙️
              </div>
              <div className="actuator-controls">
                <div className="switch-group">
                  <label className="switch-label">Estado:</label>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={actuatorStates.auto}
                      onChange={() => toggleActuator('auto')}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
            </div>

            {/* Bomba */}
            <div className="actuator-card">
              <span className="actuator-label">Bomba</span>
              <div className={`actuator-status ${actuatorStates.bomba ? 'on' : 'off'}`}>
                💧
              </div>
              <div className="actuator-controls">
                <div className="switch-group">
                  <label className="switch-label">ON/OFF:</label>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={actuatorStates.bomba}
                      onChange={() => toggleActuator('bomba')}
                      disabled={actuatorStates.auto}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
            </div>

            {/* Alarma sonora */}
            <div className="actuator-card">
              <span className="actuator-label">Alarma Sonora</span>
              <div className={`actuator-status ${actuatorStates.alarma ? 'on' : 'off'}`}>
                🔊
              </div>
              <div className="actuator-controls">
                <div className="switch-group">
                  <label className="switch-label">Silenciar (OFF):</label>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={false}
                      onChange={() => toggleActuator('alarma')}
                      disabled={!actuatorStates.alarma || actuatorStates.auto}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
            </div>

            {/* Parada de emergencia */}
            <div className="actuator-card">
              <span className="actuator-label">Parada de Emergencia</span>
              <div className={`actuator-status ${actuatorStates.emergencia_activa ? 'on' : 'off'}`}>
                🛑
              </div>
              <div className="actuator-controls">
                <button className="calculate-btn" onClick={activarEmergencia}>Activar</button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Panel 4: Estadisticas-Predicciones */}
        <div className={`panel ${activePanel === 'panel4' ? 'active' : ''}`} id="panel4">
          <h2>Estadísticas y Predicciones</h2>
          {renderEstadisticasPredicciones()}
        </div>
        
        {/* Panel 5: Tabla a solicitar */}
        <div className={`panel ${activePanel === 'panel5' ? 'active' : ''}`} id="panel5">
          <h2>Tabla de Datos Históricos</h2>
          {renderTablaSolicitar()}
        </div>
      </main>
    </div>
  );
};


export default Dashboard;
