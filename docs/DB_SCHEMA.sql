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
    dni VARCHAR(20),
    fecha_nacimiento DATE
);

-- 3. Tabla de Usuarios
CREATE TABLE Usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre_usuario VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    hash_contrasena VARCHAR(255) NOT NULL,
    id_persona INTEGER REFERENCES Personas(id_persona) ON DELETE CASCADE,
    fecha_creacion TIMESTAMPTZ DEFAULT now()
);

-- 4. Relacion Rol Usuario (Muchos a Muchos, PK compuesta)
CREATE TABLE Relacion_Rol_Usuario (
    id_usuario INTEGER REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    id_rol INTEGER REFERENCES Roles(id_rol) ON DELETE RESTRICT,
    PRIMARY KEY (id_usuario, id_rol)
);

-- 5. Relacion Nutricionista Paciente
CREATE TABLE Relacion_Nutricionista_Paciente (
    id_relacion SERIAL PRIMARY KEY,
    id_nutricionista INTEGER REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    id_paciente INTEGER REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    fecha_vinculacion DATE DEFAULT CURRENT_DATE,
    activo BOOLEAN DEFAULT TRUE,
    fecha_desvinculacion DATE
);

-- 6. Tabla de Alimentos
CREATE TABLE Alimentos (
    id_alimento SERIAL PRIMARY KEY,
    nombre_alimento VARCHAR(255) NOT NULL,
    calorias DECIMAL(10,2) NOT NULL DEFAULT 0,
    proteinas DECIMAL(10,2) NOT NULL DEFAULT 0,
    carbohidratos DECIMAL(10,2) NOT NULL DEFAULT 0,
    grasas DECIMAL(10,2) NOT NULL DEFAULT 0,
    medida_cantidad FLOAT NOT NULL DEFAULT 100,
    medida_unidad VARCHAR(20) NOT NULL DEFAULT 'g',
    codigo_barras VARCHAR(50) UNIQUE,
    origen VARCHAR(50)
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
    calorias_objetivo FLOAT NOT NULL,
    proteinas_objetivo FLOAT NOT NULL,
    carbohidratos_objetivo FLOAT NOT NULL,
    grasas_objetivo FLOAT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    id_estado INTEGER REFERENCES Estados_Plan(id_estado) DEFAULT 1,
    fecha_creacion TIMESTAMPTZ DEFAULT now()
);

-- 10. Tabla de Registros de Ingesta (Ingestas)
CREATE TABLE Registros_Ingesta (
    id_registro SERIAL PRIMARY KEY,
    id_paciente INTEGER REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    id_plan INTEGER REFERENCES Planes_Nutricionales(id_plan) ON DELETE SET NULL,
    id_alimento INTEGER REFERENCES Alimentos(id_alimento) ON DELETE CASCADE,
    cantidad FLOAT NOT NULL, -- en gramos o unidad correspondiente
    id_tipo_comida INTEGER NOT NULL REFERENCES Tipos_Comida(id_tipo_comida) ON DELETE RESTRICT,
    fecha_hora_consumo TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_creacion TIMESTAMPTZ DEFAULT now()
);

-- 11. Tabla de Mediciones (historial de peso/altura del paciente)
CREATE TABLE Mediciones (
    id_medicion SERIAL PRIMARY KEY,
    id_paciente INTEGER REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    peso_kg DECIMAL(5,2),
    altura_cm DECIMAL(5,2),
    fecha_medicion DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Indices para optimizar consultas de seguimiento
CREATE INDEX idx_ingestas_paciente ON Registros_Ingesta(id_paciente);
CREATE INDEX idx_ingestas_fecha ON Registros_Ingesta(fecha_hora_consumo);
CREATE INDEX idx_planes_relacion ON Planes_Nutricionales(id_relacion);
CREATE INDEX idx_rel_nutricionista ON Relacion_Nutricionista_Paciente(id_nutricionista);
CREATE INDEX idx_mediciones_paciente ON Mediciones(id_paciente);
