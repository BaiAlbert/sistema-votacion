-- Inserción de datos de prueba
USE db_appvotaciones;

-- Limpiamos las tablas (opcional por si lo corres varias veces)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `votos_anonimos`;
TRUNCATE TABLE `votos_registrados`;
TRUNCATE TABLE `opciones`;
TRUNCATE TABLE `votaciones`;
TRUNCATE TABLE `usuarios_grupos`;
TRUNCATE TABLE `grupos`;
TRUNCATE TABLE `usuarios`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. CREACIÓN DE USUARIOS DE PRUEBA
-- Contraseña "123456" hasheada con bcrypt: $2y$10$fedjXy3MLNjDguwZZkf4Ie.7kab4/YGmtYdPhBJgZn1ipiM3avZJy
INSERT INTO `usuarios` (`id`, `dni`, `username`, `password`, `nombre`, `apellidos`, `email`, `num_telefono`, `provincia`, `ciudad`, `rol`) VALUES
-- Administrador del Gobierno Central
(1, '12345678A', 'admin_gob', '$2y$10$fedjXy3MLNjDguwZZkf4Ie.7kab4/YGmtYdPhBJgZn1ipiM3avZJy', 'Pedro', 'Sánchez', 'gobierno@ejemplo.com', '600000001', 'Madrid', 'Madrid', 'admin_gobierno'),

-- Administrador de una Empresa Privada
(2, '87654321B', 'admin_priv', '$2y$10$fedjXy3MLNjDguwZZkf4Ie.7kab4/YGmtYdPhBJgZn1ipiM3avZJy', 'Amancio', 'Ortega', 'ceo@empresa.com', '600000002', 'A Coruña', 'Arteixo', 'admin_privado'),

-- Votantes Regulares (Con distintas provincias / ciudades para probar la segmentación)
(3, '11111111C', 'votante_madrid', '$2y$10$fedjXy3MLNjDguwZZkf4Ie.7kab4/YGmtYdPhBJgZn1ipiM3avZJy', 'Ana', 'Pérez', 'ana@ejemplo.com', '600000003', 'Madrid', 'Madrid', 'votante'),
(4, '22222222D', 'votante_mostoles', '$2y$10$fedjXy3MLNjDguwZZkf4Ie.7kab4/YGmtYdPhBJgZn1ipiM3avZJy', 'Luis', 'Gómez', 'luis@ejemplo.com', '600000004', 'Madrid', 'Móstoles', 'votante'),
(5, '33333333E', 'votante_valencia', '$2y$10$fedjXy3MLNjDguwZZkf4Ie.7kab4/YGmtYdPhBJgZn1ipiM3avZJy', 'María', 'López', 'maria@ejemplo.com', '600000005', 'Valencia', 'Valencia', 'votante');


-- 2. CREACIÓN DE GRUPOS PRIVADOS
INSERT INTO `grupos` (`id`, `nombre`, `descripcion`) VALUES
(1, 'Junta de Accionistas Inditex', 'Grupo exclusivo para accionistas mayoritarios.'),
(2, 'Sindicato de Estudiantes', 'Asamblea general de estudiantes universitarios.');


-- 3. AFILIACIÓN DE USUARIOS A GRUPOS
-- admin_priv (ID:2) es el administrador del Grupo 1
INSERT INTO `usuarios_grupos` (`id_usuario`, `id_grupo`, `estado`, `rol_grupo`) VALUES
(2, 1, 'aprobado', 'admin_privado');

-- votante_madrid (ID:3) solicita unirse al Grupo 1 pero está pendiente
INSERT INTO `usuarios_grupos` (`id_usuario`, `id_grupo`, `estado`, `rol_grupo`) VALUES
(3, 1, 'pendiente', 'miembro');

-- votante_mostoles (ID:4) es un miembro aprobado del Grupo 1
INSERT INTO `usuarios_grupos` (`id_usuario`, `id_grupo`, `estado`, `rol_grupo`) VALUES
(4, 1, 'aprobado', 'miembro');


-- 4. CREACIÓN DE VOTACIONES DE EJEMPLO
-- Votación Gubernamental #1: Nacional (La ven todos)
INSERT INTO `votaciones` (`id`, `id_autor`, `titulo`, `descripcion`, `tipo`, `alcance`, `provincia_target`, `ciudad_target`, `id_grupo`, `fecha_inicio`, `fecha_final`) VALUES
(1, 1, 'Elecciones Generales 2026', 'Elección del Presidente del Gobierno Español.', 'gubernamental', 'nacional', NULL, NULL, NULL, '2026-04-01 09:00:00', '2026-04-15 20:00:00');

-- Votación Gubernamental #2: Provincial (Solo la ven usuarios con provincia="Madrid")
INSERT INTO `votaciones` (`id`, `id_autor`, `titulo`, `descripcion`, `tipo`, `alcance`, `provincia_target`, `ciudad_target`, `id_grupo`, `fecha_inicio`, `fecha_final`) VALUES
(2, 1, 'Presupuestos Comunidad de Madrid', 'Decidir en qué gastar el superávit.', 'gubernamental', 'provincial', 'Madrid', NULL, NULL, '2026-05-01 09:00:00', '2026-05-10 20:00:00');

-- Votación Gubernamental #3: Local (Solo la ven usuarios de localidad="Móstoles" y provincia="Madrid")
INSERT INTO `votaciones` (`id`, `id_autor`, `titulo`, `descripcion`, `tipo`, `alcance`, `provincia_target`, `ciudad_target`, `id_grupo`, `fecha_inicio`, `fecha_final`) VALUES
(3, 1, 'Ampliación Parque Liana', 'Votación vecinal para renovar el parque municipal.', 'gubernamental', 'local', 'Madrid', 'Móstoles', NULL, '2026-06-01 09:00:00', '2026-06-05 20:00:00');

-- Votación Privada #4: Exclusiva para Grupo 1 (Junta de Accionistas Inditex)
INSERT INTO `votaciones` (`id`, `id_autor`, `titulo`, `descripcion`, `tipo`, `alcance`, `provincia_target`, `ciudad_target`, `id_grupo`, `fecha_inicio`, `fecha_final`) VALUES
(4, 2, 'Aprobación Dividendo 2026', 'Decidir si repartimos beneficios extraordinarios.', 'privada', NULL, NULL, NULL, 1, '2026-03-10 09:00:00', '2026-03-20 20:00:00');


-- 5. OPCIONES DE LAS VOTACIONES
-- Opciones Generales (Votación 1)
INSERT INTO `opciones` (`id_votacion`, `nombre_opcion`, `desc_opcion`) VALUES
(1, 'Partido Rojo', 'Progresistas'),
(1, 'Partido Azul', 'Conservadores');

-- Opciones Móstoles (Votación 3)
INSERT INTO `opciones` (`id_votacion`, `nombre_opcion`, `desc_opcion`) VALUES
(3, 'Sí, quiero más árboles', 'Proyecto de reforestación Liana'),
(3, 'No, prefiero asfalto', 'Mantener estado actual');

-- Opciones Privada Inditex (Votación 4)
INSERT INTO `opciones` (`id_votacion`, `nombre_opcion`, `desc_opcion`) VALUES
(4, 'Aprobar pago dividendo de 2€', 'Reparto general'),
(4, 'Reinvertir en infraestructura', 'No repartir, abrir nuevas tiendas');
