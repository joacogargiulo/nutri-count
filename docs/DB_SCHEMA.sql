-- ==========================================================
-- SCRIPT DE CREACION DE BASE DE DATOS - NUTRI COUNT
-- MATERIA: Taller Integrador III (Grupo de Gonella)
-- COMPATIBLE CON: Supabase PostgreSQL
-- ==========================================================

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
    id_persona VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    genero VARCHAR(50),
    dni VARCHAR(20),
    fecha_nacimiento DATE
);

-- 3. Tabla de Usuarios
CREATE TABLE Usuarios (
    id_usuario VARCHAR(50) PRIMARY KEY,
    nombre_usuario VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    hash_contrasena VARCHAR(255) NOT NULL,
    id_persona VARCHAR(50) REFERENCES Personas(id_persona) ON DELETE CASCADE
);

-- 4. Relacion Rol Usuario (Muchos a Muchos / Relación única por usuario para simplificar)
CREATE TABLE Relacion_Rol_Usuario (
    id_relacion VARCHAR(50) PRIMARY KEY,
    id_usuario VARCHAR(50) REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    id_rol INTEGER REFERENCES Roles(id_rol) ON DELETE RESTRICT,
    CONSTRAINT unique_usuario_rol UNIQUE (id_usuario, id_rol)
);

-- 5. Relacion Nutricionista Paciente
CREATE TABLE Relacion_Nutricionista_Paciente (
    id_relacion VARCHAR(50) PRIMARY KEY,
    id_nutricionista VARCHAR(50) REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    id_paciente VARCHAR(50) REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    fecha_vinculacion DATE DEFAULT CURRENT_DATE,
    activo BOOLEAN DEFAULT TRUE,
    fecha_desvinculacion DATE
);

-- 6. Tabla de Alimentos
CREATE TABLE Alimentos (
    id_alimento VARCHAR(50) PRIMARY KEY,
    nombre_alimento VARCHAR(255) NOT NULL,
    calorias FLOAT NOT NULL DEFAULT 0,
    proteinas FLOAT NOT NULL DEFAULT 0,
    carbohidratos FLOAT NOT NULL DEFAULT 0,
    grasas FLOAT NOT NULL DEFAULT 0,
    medida_cantidad FLOAT NOT NULL DEFAULT 100,
    medida_unidad VARCHAR(20) NOT NULL DEFAULT 'g'
);

-- 7. Tabla de Estados de Plan
CREATE TABLE Estados_Plan (
    id_estado VARCHAR(20) PRIMARY KEY, -- 'Activo', 'Inactivo'
    nombre_estado VARCHAR(50) NOT NULL
);

INSERT INTO Estados_Plan (id_estado, nombre_estado) VALUES 
('Activo', 'Plan Nutricional Vigente'),
('Inactivo', 'Plan Nutricional Histórico');

-- 8. Tabla de Planes Nutricionales
CREATE TABLE Planes_Nutricionales (
    id_plan VARCHAR(50) PRIMARY KEY,
    id_paciente VARCHAR(50) REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    id_nutricionista VARCHAR(50) REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    calorias_objetivo FLOAT NOT NULL,
    proteinas_objetivo FLOAT NOT NULL,
    carbohidratos_objetivo FLOAT NOT NULL,
    grasas_objetivo FLOAT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    id_estado VARCHAR(20) REFERENCES Estados_Plan(id_estado) DEFAULT 'Activo'
);

-- 9. Tabla de Registros de Ingesta (Ingestas)
CREATE TABLE Registros_Ingesta (
    id_registro VARCHAR(50) PRIMARY KEY,
    id_paciente VARCHAR(50) REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    id_plan VARCHAR(50) REFERENCES Planes_Nutricionales(id_plan) ON DELETE SET NULL,
    id_alimento VARCHAR(50) REFERENCES Alimentos(id_alimento) ON DELETE CASCADE,
    cantidad FLOAT NOT NULL, -- en gramos o unidad correspondiente
    tipo_comida VARCHAR(50) NOT NULL, -- 'Desayuno', 'Almuerzo', 'Merienda', 'Cena'
    fecha_hora_consumo TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- Indices para optimizar consultas de seguimiento
CREATE INDEX idx_ingestas_paciente ON Registros_Ingesta(id_paciente);
CREATE INDEX idx_ingestas_fecha ON Registros_Ingesta(fecha_hora_consumo);
CREATE INDEX idx_planes_paciente ON Planes_Nutricionales(id_paciente);
CREATE INDEX idx_rel_nutricionista ON Relacion_Nutricionista_Paciente(id_nutricionista);