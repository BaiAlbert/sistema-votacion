CREATE TABLE `usuarios` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `dni` varchar(9) UNIQUE NOT NULL,
  `username` varchar(50) UNIQUE NOT NULL,
  `password` varchar(255) NOT NULL COMMENT 'Hasheada con bcrypt',
  `nombre` varchar(50) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `email` varchar(100) UNIQUE NOT NULL,
  `num_telefono` varchar(9) UNIQUE NOT NULL COMMENT 'Solo numeros españoles',
  `provincia` varchar(50) NOT NULL,
  `ciudad` varchar(50) NOT NULL,
  `rol` varchar(20) NOT NULL DEFAULT 'votante' COMMENT 'votante, admin_privado o admin_gobierno',
  `fecha_creacion` timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `votaciones` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `id_autor` integer NOT NULL,
  `titulo` varchar(100) NOT NULL,
  `descripcion` text,
  `tipo` varchar(30) NOT NULL DEFAULT 'publica' COMMENT 'publica, privada, gubernamental',
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_inicio` datetime NOT NULL,
  `fecha_final` datetime NOT NULL,
  `cerrada` boolean NOT NULL DEFAULT false,
  `razon_cierre` text
);

CREATE TABLE `censo_votaciones` (
  `id_votacion` integer NOT NULL,
  `id_usuario` integer NOT NULL
);

CREATE TABLE `opciones` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `id_votacion` integer NOT NULL,
  `nombre_opcion` varchar(50) NOT NULL,
  `desc_opcion` text
);

CREATE TABLE `registro_participacion` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `id_votacion` integer NOT NULL,
  `id_votante` integer NOT NULL,
  `fecha_participacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `votos_anonimos` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `id_votacion` integer NOT NULL,
  `id_opcion` integer NOT NULL,
  `hash_integridad` varchar(255) UNIQUE COMMENT 'Hash generado por backend para verificar que el voto no fue manipulado en BBDD',
  `fecha_voto` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX `censo_votaciones_index_0` ON `censo_votaciones` (`id_votacion`, `id_usuario`);

CREATE UNIQUE INDEX `registro_participacion_index_1` ON `registro_participacion` (`id_votacion`, `id_votante`);

ALTER TABLE `votaciones` ADD FOREIGN KEY (`id_autor`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE `censo_votaciones` ADD FOREIGN KEY (`id_votacion`) REFERENCES `votaciones` (`id`) ON DELETE CASCADE;

ALTER TABLE `censo_votaciones` ADD FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

ALTER TABLE `opciones` ADD FOREIGN KEY (`id_votacion`) REFERENCES `votaciones` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE `registro_participacion` ADD FOREIGN KEY (`id_votacion`) REFERENCES `votaciones` (`id`) ON DELETE CASCADE;

ALTER TABLE `registro_participacion` ADD FOREIGN KEY (`id_votante`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

ALTER TABLE `votos_anonimos` ADD FOREIGN KEY (`id_votacion`) REFERENCES `votaciones` (`id`) ON DELETE CASCADE;

ALTER TABLE `votos_anonimos` ADD FOREIGN KEY (`id_opcion`) REFERENCES `opciones` (`id`) ON DELETE CASCADE;
