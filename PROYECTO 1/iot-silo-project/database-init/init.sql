-- Crear tablas para almacenar datos históricos de los sensores
CREATE TABLE IF NOT EXISTS nivel_liquido (
    id SERIAL PRIMARY KEY,
    valor FLOAT NOT NULL,
    unidad VARCHAR(10) NOT NULL DEFAULT '%',
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para temperatura del líquido
CREATE TABLE IF NOT EXISTS temperatura_liquido (
    id SERIAL PRIMARY KEY,
    valor FLOAT NOT NULL,
    unidad VARCHAR(20) NOT NULL DEFAULT '°C',
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para temperatura ambiente
CREATE TABLE IF NOT EXISTS temperatura_ambiente (
    id SERIAL PRIMARY KEY,
    valor FLOAT NOT NULL,
    unidad VARCHAR(10) NOT NULL DEFAULT '°C',
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para humedad ambiente
CREATE TABLE IF NOT EXISTS humedad (
    id SERIAL PRIMARY KEY,
    valor FLOAT NOT NULL,
    unidad VARCHAR(10) NOT NULL DEFAULT '%',
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para tiempos de llenado
CREATE TABLE IF NOT EXISTS tiempo_llenado (
    id SERIAL PRIMARY KEY,
    valor FLOAT NOT NULL,
    unidad VARCHAR(10) NOT NULL DEFAULT 'segundos',
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para eventos críticos del sistema
CREATE TABLE IF NOT EXISTS eventos_sistema (
    id SERIAL PRIMARY KEY,
    tipo_evento VARCHAR(50) NOT NULL,
    descripcion TEXT,
    severidad VARCHAR(20) DEFAULT 'INFO', -- INFO, WARNING, ERROR, CRITICAL
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para registrar estados de la bomba
CREATE TABLE IF NOT EXISTS estados_bomba (
    id SERIAL PRIMARY KEY,
    estado VARCHAR(10) NOT NULL, -- ON, OFF
    modo VARCHAR(20) NOT NULL, -- AUTOMATICO, MANUAL
    emergencia BOOLEAN NOT NULL DEFAULT FALSE,
    alarma BOOLEAN NOT NULL DEFAULT FALSE,
    tiempo_operacion INTEGER DEFAULT 0, -- en segundos
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_nivel_liquido_fecha ON nivel_liquido(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_temp_liquido_fecha ON temperatura_liquido(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_temp_ambiente_fecha ON temperatura_ambiente(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_humedad_fecha ON humedad(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_tiempo_llenado_fecha ON tiempo_llenado(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_eventos_fecha ON eventos_sistema(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_bomba_fecha ON estados_bomba(fecha_hora);