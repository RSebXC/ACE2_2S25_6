-- este archivo se ejecuta automatico cuando se crea el contenedor en docker

-- Crear las tablas para almacenar datos históricos de los sensores
CREATE TABLE IF NOT EXISTS nivel_liquido (
    id SERIAL PRIMARY KEY,
    valor FLOAT NOT NULL,
    unidad VARCHAR(10) NOT NULL DEFAULT '%',
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- creamos la tabla de la temperatura del liquido
CREATE TABLE IF NOT EXISTS temperatura_liquido(
    id SERIAL PRIMARY KEY,
    valor FLOAT NOT NULL,
    unidad VARCHAR(20) NOT NULL DEFAULT '°C',
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- creamos la tabla de la temperatura ambiente
CREATE TABLE IF NOT EXISTS temperatura_ambiente (
    id SERIAL PRIMARY KEY,
    valor FLOAT NOT NULL,
    unidad VARCHAR(10) NOT NULL DEFAULT '°C',
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- creamos la tabla de la humedad ambiente
CREATE TABLE IF NOT EXISTS humedad (
    id SERIAL PRIMARY KEY,
    valor FLOAT NOT NULL,
    unidad VARCHAR(10) NOT NULL DEFAULT '%',
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
    tiempo_operacion INTEGER DEFAULT 0, -- en segundos
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Creamos los indices para optimizar las consultas

-- Sin los indices las consutlas serian muy lentas debido a que tiene que ir a consultar toda la tabla
-- con los indices solo tiene que buscar en el indice que es mucho mas rapido

CREATE INDEX IF NOT EXISTS idx_nivel_liquido_fecha ON nivel_liquido(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_temp_liquido_fecha ON temperatura_liquido(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_temp_ambiente_fecha ON temperatura_ambiente(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_humedad_fecha ON humedad(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_eventos_fecha ON eventos_sistema(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_bomba_fecha ON estados_bomba(fecha_hora);

