-- ==========================================================
-- SCRIPT DE CREACION DE BASE DE DATOS - NUTRI COUNT
-- MATERIA: Taller Integrador III (Grupo de Gonella)
-- COMPATIBLE CON: Supabase PostgreSQL
-- ==========================================================

-- Reinicia el esquema por completo (re-ejecutable de punta a punta)
DROP TABLE IF EXISTS Registros_Ingesta, Mediciones, Planes_Nutricionales, Tipos_Comida,
    Estados_Plan, Alimentos, Relacion_Nutricionista_Paciente, Relacion_Rol_Usuario,
    Usuarios, Personas, Roles CASCADE;

-- 1. Tabla de Roles
CREATE TABLE Roles (
    id_rol SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(50) UNIQUE NOT NULL
);

-- Insertar roles basicos definidos en el sistema
INSERT INTO Roles (id_rol, nombre_rol) VALUES
(1, 'Nutricionista'),
(2, 'Paciente');

-- 2. Tabla de Personas
CREATE TABLE Personas (
    id_persona SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    genero VARCHAR(50),
    fecha_nacimiento DATE
);

-- 3. Tabla de Usuarios
CREATE TABLE Usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre_usuario VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    hash_contrasena VARCHAR(255) NOT NULL,
    id_persona INTEGER NOT NULL UNIQUE REFERENCES Personas(id_persona) ON DELETE CASCADE, -- relacion 1 a 1
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unicidad sin distinguir mayusculas: respalda a nivel BD la validacion de la API (evita carreras entre dos registros simultaneos)
CREATE UNIQUE INDEX uq_usuarios_email_ci ON Usuarios (lower(email));
CREATE UNIQUE INDEX uq_usuarios_nombre_usuario_ci ON Usuarios (lower(nombre_usuario));

-- 4. Relacion Rol Usuario (Muchos a Muchos, PK compuesta)
CREATE TABLE Relacion_Rol_Usuario (
    id_usuario INTEGER REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    id_rol INTEGER REFERENCES Roles(id_rol) ON DELETE RESTRICT,
    PRIMARY KEY (id_usuario, id_rol)
);

-- 5. Relacion Nutricionista Paciente
CREATE TABLE Relacion_Nutricionista_Paciente (
    id_relacion SERIAL PRIMARY KEY,
    id_nutricionista INTEGER NOT NULL REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    id_paciente INTEGER NOT NULL REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    fecha_vinculacion DATE NOT NULL DEFAULT CURRENT_DATE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_desvinculacion DATE,
    CONSTRAINT ck_relacion_distintos CHECK (id_nutricionista <> id_paciente)
);

-- Un nutricionista no puede tener dos vinculos ACTIVOS con el mismo paciente (los inactivos quedan como historial)
CREATE UNIQUE INDEX uq_relacion_activa ON Relacion_Nutricionista_Paciente (id_nutricionista, id_paciente) WHERE activo;

-- 6. Tabla de Alimentos
CREATE TABLE Alimentos (
    id_alimento SERIAL PRIMARY KEY,
    nombre_alimento VARCHAR(255) NOT NULL,
    calorias DECIMAL(10,2) NOT NULL DEFAULT 0,
    proteinas DECIMAL(10,2) NOT NULL DEFAULT 0,
    carbohidratos DECIMAL(10,2) NOT NULL DEFAULT 0,
    grasas DECIMAL(10,2) NOT NULL DEFAULT 0,
    medida_cantidad NUMERIC(8,2) NOT NULL DEFAULT 100,
    medida_unidad VARCHAR(20) NOT NULL DEFAULT 'g',
    codigo_barras VARCHAR(50) UNIQUE,
    origen VARCHAR(50),
    CONSTRAINT ck_alimentos_valores CHECK (calorias >= 0 AND proteinas >= 0 AND carbohidratos >= 0 AND grasas >= 0),
    CONSTRAINT ck_alimentos_medida CHECK (medida_cantidad > 0)
);

-- 7. Tabla de Estados de Plan
CREATE TABLE Estados_Plan (
    id_estado SERIAL PRIMARY KEY,
    nombre_estado VARCHAR(50) NOT NULL
);

-- Valores fijos: deben coincidir con el enum EstadoPlan de src/types.ts
INSERT INTO Estados_Plan (id_estado, nombre_estado) VALUES
(1, 'Activo'),
(2, 'Pausado'),
(3, 'Cancelado'),
(4, 'Completado'),
(5, 'Vencido');

-- 8. Tabla de Tipos de Comida
CREATE TABLE Tipos_Comida (
    id_tipo_comida SERIAL PRIMARY KEY,
    nombre_tipo VARCHAR(50) NOT NULL UNIQUE
);

-- Valores fijos: deben coincidir con el union type TipoComida de src/types.ts
INSERT INTO Tipos_Comida (id_tipo_comida, nombre_tipo) VALUES
(1, 'Desayuno'),
(2, 'Colación'),
(3, 'Almuerzo'),
(4, 'Merienda'),
(5, 'Cena');

-- 9. Tabla de Planes Nutricionales
CREATE TABLE Planes_Nutricionales (
    id_plan SERIAL PRIMARY KEY,
    id_relacion INTEGER NOT NULL REFERENCES Relacion_Nutricionista_Paciente(id_relacion) ON DELETE CASCADE,
    calorias_objetivo NUMERIC(8,2) NOT NULL,
    proteinas_objetivo NUMERIC(8,2) NOT NULL,
    carbohidratos_objetivo NUMERIC(8,2) NOT NULL,
    grasas_objetivo NUMERIC(8,2) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    id_estado INTEGER NOT NULL REFERENCES Estados_Plan(id_estado) DEFAULT 1,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_planes_objetivos CHECK (calorias_objetivo > 0 AND proteinas_objetivo > 0 AND carbohidratos_objetivo > 0 AND grasas_objetivo > 0),
    CONSTRAINT ck_planes_fechas CHECK (fecha_fin >= fecha_inicio)
);

-- 10. Tabla de Registros de Ingesta (Ingestas)
CREATE TABLE Registros_Ingesta (
    id_registro SERIAL PRIMARY KEY,
    id_paciente INTEGER NOT NULL REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    id_plan INTEGER REFERENCES Planes_Nutricionales(id_plan) ON DELETE SET NULL,
    -- RESTRICT: no se puede borrar un alimento que ya fue consumido (preserva el historial del paciente)
    id_alimento INTEGER NOT NULL REFERENCES Alimentos(id_alimento) ON DELETE RESTRICT,
    cantidad NUMERIC(8,2) NOT NULL CHECK (cantidad > 0), -- en gramos o unidad correspondiente
    id_tipo_comida INTEGER NOT NULL REFERENCES Tipos_Comida(id_tipo_comida) ON DELETE RESTRICT,
    fecha_hora_consumo TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Tabla de Mediciones (historial de peso/altura del paciente)
CREATE TABLE Mediciones (
    id_medicion SERIAL PRIMARY KEY,
    id_paciente INTEGER NOT NULL REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    peso_kg DECIMAL(5,2),
    altura_cm DECIMAL(5,2),
    fecha_medicion DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Indices para optimizar consultas de seguimiento
-- Consulta diaria de ingestas: WHERE id_paciente = ? AND fecha_hora_consumo >= ? AND < ?
CREATE INDEX idx_ingestas_paciente_fecha ON Registros_Ingesta(id_paciente, fecha_hora_consumo);
CREATE INDEX idx_alimentos_nombre ON Alimentos (lower(nombre_alimento));
CREATE INDEX idx_planes_relacion ON Planes_Nutricionales(id_relacion);
CREATE INDEX idx_rel_nutricionista ON Relacion_Nutricionista_Paciente(id_nutricionista);
CREATE INDEX idx_mediciones_paciente ON Mediciones(id_paciente);
