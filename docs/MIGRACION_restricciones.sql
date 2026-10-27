-- ==========================================================
-- MIGRACION: restricciones de integridad e indices
-- Se aplica sobre una base YA CREADA (no borra datos).
-- Equivale a los cambios hechos en docs/DB_SCHEMA.sql para instalaciones nuevas.
-- Ejecutar completo en el SQL Editor de Supabase. Es una sola transaccion:
-- si algun dato existente viola una restriccion, no se aplica nada y el error indica cual.
-- ==========================================================

BEGIN;

-- Unicidad de email y nombre de usuario sin distinguir mayusculas
CREATE UNIQUE INDEX IF NOT EXISTS uq_usuarios_email_ci ON Usuarios (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS uq_usuarios_nombre_usuario_ci ON Usuarios (lower(nombre_usuario));

-- Vinculos: un nutricionista no se vincula a si mismo ni tiene dos vinculos activos con el mismo paciente
ALTER TABLE Relacion_Nutricionista_Paciente
    ADD CONSTRAINT ck_relacion_distintos CHECK (id_nutricionista <> id_paciente);
CREATE UNIQUE INDEX IF NOT EXISTS uq_relacion_activa
    ON Relacion_Nutricionista_Paciente (id_nutricionista, id_paciente) WHERE activo;

-- Alimentos: valores nutricionales no negativos y medida positiva
ALTER TABLE Alimentos
    ADD CONSTRAINT ck_alimentos_valores CHECK (calorias >= 0 AND proteinas >= 0 AND carbohidratos >= 0 AND grasas >= 0),
    ADD CONSTRAINT ck_alimentos_medida CHECK (medida_cantidad > 0);

-- Planes: objetivos positivos y rango de fechas coherente
ALTER TABLE Planes_Nutricionales
    ADD CONSTRAINT ck_planes_objetivos CHECK (calorias_objetivo > 0 AND proteinas_objetivo > 0 AND carbohidratos_objetivo > 0 AND grasas_objetivo > 0),
    ADD CONSTRAINT ck_planes_fechas CHECK (fecha_fin >= fecha_inicio);

-- Ingestas: cantidad positiva y el alimento consumido no se puede borrar (RESTRICT en lugar de CASCADE)
ALTER TABLE Registros_Ingesta
    ADD CONSTRAINT ck_ingesta_cantidad CHECK (cantidad > 0);
ALTER TABLE Registros_Ingesta DROP CONSTRAINT IF EXISTS registros_ingesta_id_alimento_fkey;
ALTER TABLE Registros_Ingesta
    ADD CONSTRAINT registros_ingesta_id_alimento_fkey
    FOREIGN KEY (id_alimento) REFERENCES Alimentos(id_alimento) ON DELETE RESTRICT;

-- Indices para las consultas de seguimiento y busqueda
DROP INDEX IF EXISTS idx_ingestas_paciente;
DROP INDEX IF EXISTS idx_ingestas_fecha;
CREATE INDEX IF NOT EXISTS idx_ingestas_paciente_fecha ON Registros_Ingesta (id_paciente, fecha_hora_consumo);
CREATE INDEX IF NOT EXISTS idx_alimentos_nombre ON Alimentos (lower(nombre_alimento));

COMMIT;
