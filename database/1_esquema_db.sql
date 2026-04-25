-- Creamos un usuario sin contraseña y con simple privilegio de usage (sinonimo de sin privilegios)
-- para que haproxy pueda hacer sus healthchecks
CREATE USER IF NOT EXISTS 'haproxy_check'@'%' IDENTIFIED BY '';
GRANT USAGE ON *.* TO 'haproxy_check'@'%';

USE db_appvotaciones;

-- 1. TABLA: usuarios
-- Almacena la información de los votantes y administradores en el sistema.
CREATE TABLE `usuarios` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `dni_hash` varchar(64) UNIQUE NOT NULL COMMENT 'Hash HMAC SHA-256 del DNI',
  `password` varchar(255) NOT NULL COMMENT 'Hasheada con bcrypt',
  `nombre` varchar(50) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `email` varchar(100) UNIQUE NOT NULL,
  `num_telefono` varchar(9) UNIQUE NOT NULL COMMENT 'Solo numeros españoles',
  `provincia` varchar(50) NOT NULL,
  `ciudad` varchar(50) NOT NULL,
  `rol` varchar(20) NOT NULL DEFAULT 'votante' COMMENT 'votante, admin_privado o admin_gobierno',
  `fecha_creacion` timestamp DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_es_0900_ai_ci;


-- 2. TABLA: grupos
-- Almacena las empresas, organismos o colectivos privados que pueden organizar 
-- sus propias votaciones exclusivas.
CREATE TABLE `grupos` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text,
  `fecha_creacion` timestamp DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_es_0900_ai_ci;


-- 3. TABLA: usuarios_grupos (Relación N a M)
-- En lugar de añadir un campo "grupo_id" en la tabla "usuarios" (lo cual limitaría
-- a que un usuario solo pudiera estar en un grupo), esta tabla permite que un 
-- usuario pertenezca a múltiples grupos.
-- Además, maneja el flujo de "solicitudes de ingreso" mediante el campo `estado`. 
-- Un usuario hace la solicitud (estado 'pendiente') y luego un admin_privado 
-- del grupo lo acepta (estado 'aprobado').
CREATE TABLE `usuarios_grupos` (
  `id_usuario` integer NOT NULL,
  `id_grupo` integer NOT NULL,
  `estado` varchar(20) NOT NULL DEFAULT 'pendiente' COMMENT 'estados: pendiente, aprobado, rechazado. Entra en pendiente hasta revisión.',
  `rol_grupo` varchar(20) NOT NULL DEFAULT 'miembro' COMMENT 'rol dentro del grupo: miembro o admin_privado. El admin_privado gestiona las aprobaciones.',
  `fecha_solicitud` timestamp DEFAULT CURRENT_TIMESTAMP,
  `fecha_resolucion` timestamp NULL,
  PRIMARY KEY (`id_usuario`, `id_grupo`),
  FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`id_grupo`) REFERENCES `grupos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_es_0900_ai_ci;


-- 4. TABLA: votaciones
-- Almacena todas las votaciones realizadas en el sistema (tanto gubernamentales 
-- como privadas). Incorpora el cierre manual y segmentación por alcance/grupo.
CREATE TABLE `votaciones` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `id_autor` integer NOT NULL,
  `titulo` varchar(100) NOT NULL,
  `descripcion` text,
  
  -- Clasificación principal
  `tipo` varchar(20) NOT NULL COMMENT 'puede ser: gubernamental o privada',
  
  -- Segmentación para votaciones Gubernamentales
  `alcance` varchar(20) COMMENT 'nacional, provincial o local',
  `provincia_target` varchar(50) COMMENT 'Obligatorio si alcance es provincial o local',
  `ciudad_target` varchar(50) COMMENT 'Obligatorio si alcance es local',
  
  -- Segmentación para votaciones Privadas
  `id_grupo` integer COMMENT 'Asocia la votación al grupo que la organiza. Requerido si tipo es privada.',
  
  -- Aspecto temporal
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_inicio` datetime NOT NULL,
  `fecha_final` datetime NOT NULL,
  
  -- Control de estado
  `cerrada` boolean NOT NULL DEFAULT false COMMENT 'True si ha sido cerrada manualmente por un admin antes de tiempo',
  `razon_cierre` text COMMENT 'Explicación de por qué se clausuró prematuramente',
  `id_opcion_ganadora` integer DEFAULT NULL COMMENT 'Almacena la opción con más votos al finalizar',
  
  FOREIGN KEY (`id_autor`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`id_grupo`) REFERENCES `grupos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_es_0900_ai_ci;


-- 5. TABLA: opciones
-- Las distintas opciones o candidaturas sobre las que se puede votar.
CREATE TABLE `opciones` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `id_votacion` integer NOT NULL,
  `nombre_opcion` varchar(100) NOT NULL,
  `desc_opcion` text,
  FOREIGN KEY (`id_votacion`) REFERENCES `votaciones` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_es_0900_ai_ci;

-- Establecemos la relación de la opción ganadora en la tabla votaciones
-- Lo hacemos después de la creación de la tabla opciones ya que lo ideal seria
-- hacerlo cuando creamos la tabla votaciones pero en ese momento no existe la 
-- tabla opciones y MariaDB lanzaría un error
ALTER TABLE `votaciones` 
  ADD CONSTRAINT `fk_opcion_ganadora` 
  FOREIGN KEY (`id_opcion_ganadora`) 
  REFERENCES `opciones` (`id`) 
  ON DELETE SET NULL;

-- SISTEMA DE ANONIMATO E INTEGRIDAD
-- Las siguientes dos tablas se encargan de separar "Quién ha votado" de 
-- "Qué se ha votado" salvaguardando el derecho al voto secreto.

-- 6. TABLA: votos_registrados (El Censo Físico - Quién ha votado)
-- Guarda constancia de que un usuario YA formó parte de la votación, evitando 
-- el voto duplicado. Sin embargo, no guarda qué opción eligió.
CREATE TABLE `votos_registrados` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `id_votacion` integer NOT NULL,
  `id_usuario` integer NOT NULL,
  `fecha_participacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- Evitamos que un mismo usuario vote dos veces en la misma votación
  UNIQUE (`id_votacion`, `id_usuario`),
  FOREIGN KEY (`id_votacion`) REFERENCES `votaciones` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_es_0900_ai_ci;

-- 7. TABLA: votos_anonimos (La Urna - Qué se ha votado)
-- Almacena las "papeletas" introducidas en la votación. Es imposible relacionar 
-- esta tabla con un usuario en específico asegurando el anonimato.
CREATE TABLE `votos_anonimos` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `id_votacion` integer NOT NULL,
  `id_opcion` integer NOT NULL,
  `hash_integridad` varchar(255) UNIQUE COMMENT 'Firma blockchain/cryptografica para detectar manipulaciones en la BBDD',
  `fecha_voto` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_votacion`) REFERENCES `votaciones` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`id_opcion`) REFERENCES `opciones` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_es_0900_ai_ci;
