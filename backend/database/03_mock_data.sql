-- -------------------------------------------------------------
-- SCRIPT DE DATOS DE PRUEBA (MOCK DATA)
-- Contraseñas: El hash bcrypt utilizado equivale a 123456.
-- Fecha de simulación: 7 de marzo de 2026, 17:58.
-- -------------------------------------------------------------

USE db_appvotaciones;

SET NAMES 'utf8mb4' COLLATE 'utf8mb4_es_0900_ai_ci';

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

-- 1. USUARIOS
-- 1.1 Administradores de Gobierno (3)
INSERT INTO usuarios (dni, username, password, nombre, apellidos, email, num_telefono, provincia, ciudad, rol) VALUES
('11111111A', 'admin_gob1', '$2y$10$fedjXy3MLNjDguwZZkf4Ie.7kab4/YGmtYdPhBJgZn1ipiM3avZJy', 'Carlos', 'Gómez', 'carlos.gob@test.com', '600000001', 'Madrid', 'Madrid', 'admin_gobierno'),
('22222222B', 'admin_gob2', '$2y$10$fedjXy3MLNjDguwZZkf4Ie.7kab4/YGmtYdPhBJgZn1ipiM3avZJy', 'Laura', 'Pérez', 'laura.gob@test.com', '600000002', 'Valencia', 'Valencia', 'admin_gobierno'),
('33333333C', 'admin_gob3', '$2y$10$fedjXy3MLNjDguwZZkf4Ie.7kab4/YGmtYdPhBJgZn1ipiM3avZJy', 'Miguel', 'Sánchez', 'miguel.gob@test.com', '600000003', 'Andalucía', 'Sevilla', 'admin_gobierno');

-- 1.2 Administradores Privados (4)
INSERT INTO usuarios (dni, username, password, nombre, apellidos, email, num_telefono, provincia, ciudad, rol) VALUES
('44444444D', 'admin_priv1', '$2y$10$fedjXy3MLNjDguwZZkf4Ie.7kab4/YGmtYdPhBJgZn1ipiM3avZJy', 'Luis', 'Fernández', 'luis.priv@test.com', '600000004', 'Madrid', 'Madrid', 'admin_privado'),
('55555555E', 'admin_priv2', '$2y$10$fedjXy3MLNjDguwZZkf4Ie.7kab4/YGmtYdPhBJgZn1ipiM3avZJy', 'Marta', 'Jiménez', 'marta.priv@test.com', '600000005', 'Valencia', 'Alicante', 'admin_privado'),
('66666666F', 'admin_priv3', '$2y$10$fedjXy3MLNjDguwZZkf4Ie.7kab4/YGmtYdPhBJgZn1ipiM3avZJy', 'Elena', 'Ruiz', 'elena.priv@test.com', '600000006', 'Andalucía', 'Sevilla', 'admin_privado'),
('77777777G', 'admin_priv4', '$2y$10$fedjXy3MLNjDguwZZkf4Ie.7kab4/YGmtYdPhBJgZn1ipiM3avZJy', 'Jorge', 'Martín', 'jorge.priv@test.com', '600000007', 'Madrid', 'Madrid', 'admin_privado');

-- 1.3 Votantes (6 - Segmentados geográficamente)
INSERT INTO usuarios (dni, username, password, nombre, apellidos, email, num_telefono, provincia, ciudad, rol) VALUES
('88888888H', 'votante_mad1', '$2y$10$fedjXy3MLNjDguwZZkf4Ie.7kab4/YGmtYdPhBJgZn1ipiM3avZJy', 'Ana', 'López', 'ana.mad@test.com', '600000008', 'Madrid', 'Madrid', 'votante'),
('99999999J', 'votante_mad2', '$2y$10$fedjXy3MLNjDguwZZkf4Ie.7kab4/YGmtYdPhBJgZn1ipiM3avZJy', 'Pedro', 'Díaz', 'pedro.mad@test.com', '600000009', 'Madrid', 'Madrid', 'votante'),
('10101010K', 'votante_val1', '$2y$10$fedjXy3MLNjDguwZZkf4Ie.7kab4/YGmtYdPhBJgZn1ipiM3avZJy', 'Sofia', 'Martínez', 'sofia.val@test.com', '600000010', 'Valencia', 'Alicante', 'votante'),
('11110000L', 'votante_val2', '$2y$10$fedjXy3MLNjDguwZZkf4Ie.7kab4/YGmtYdPhBJgZn1ipiM3avZJy', 'Pablo', 'García', 'pablo.val@test.com', '600000011', 'Valencia', 'Alicante', 'votante'),
('12121212M', 'votante_and1', '$2y$10$fedjXy3MLNjDguwZZkf4Ie.7kab4/YGmtYdPhBJgZn1ipiM3avZJy', 'Lucia', 'Herrera', 'lucia.and@test.com', '600000012', 'Andalucía', 'Sevilla', 'votante'),
('13131313N', 'votante_and2', '$2y$10$fedjXy3MLNjDguwZZkf4Ie.7kab4/YGmtYdPhBJgZn1ipiM3avZJy', 'Diego', 'Torres', 'diego.and@test.com', '600000013', 'Andalucía', 'Sevilla', 'votante');


-- 2. GRUPOS (3 distintos)
INSERT INTO grupos (id, nombre, descripcion) VALUES
(1, 'Tech Solutions SL', 'Empresa de desarrollo de software'),
(2, 'Asociación Vecinos Los Pinos', 'Comunidad vecinal del bloque 4'),
(3, 'Club Deportivo Triatlón', 'Club para amantes del deporte y competiciones');


-- 3. USUARIOS_GRUPOS (Combinando aprobados, pendientes, N:M y N admins)
-- IDs relevantes (Admins: 4, 5, 6, 7 | Votantes: 8, 9, 10, 11, 12, 13)
INSERT INTO usuarios_grupos (id_usuario, id_grupo, estado, rol_grupo) VALUES
-- Grupo 1: Empresa: 2 admins y 2 miembros (1 pendiente)
(4, 1, 'aprobado', 'admin_privado'),
(5, 1, 'aprobado', 'admin_privado'),
(8, 1, 'aprobado', 'miembro'),
(9, 1, 'pendiente', 'miembro'),

-- Grupo 2: Vecinos (El usuario 9 repite -> Relación N a M)
(6, 2, 'aprobado', 'admin_privado'),
(7, 2, 'aprobado', 'admin_privado'),
(9, 2, 'aprobado', 'miembro'),
(10, 2, 'aprobado', 'miembro'),
(11, 2, 'pendiente', 'miembro'),

-- Grupo 3: Club (Los usuarios 8 y 10 repiten)
(4, 3, 'aprobado', 'admin_privado'),
(12, 3, 'aprobado', 'miembro'),
(13, 3, 'aprobado', 'miembro'),
(8, 3, 'aprobado', 'miembro'),
(10, 3, 'rechazado', 'miembro');


-- 4. VOTACIONES 
-- Hoy: 2026-03-07 17:58
INSERT INTO votaciones (id, id_autor, titulo, descripcion, tipo, alcance, provincia_target, ciudad_target, id_grupo, fecha_inicio, fecha_final) VALUES
-- Gubernamental 1: Nacional Activa (En curso: inicio pasado, final futuro)
(1, 1, 'Elecciones Generales 2026', 'Elección de representantes al parlamento nacional', 'gubernamental', 'nacional', NULL, NULL, NULL, '2026-03-01 09:00:00', '2026-03-15 20:00:00'),

-- Gubernamental 2: Provincial Finalizada (Inicio y final en el pasado)
(2, 2, 'Referéndum de Infraestructuras', 'Aprobación del presupuesto para el nuevo puente de cercanías', 'gubernamental', 'provincial', 'Valencia', NULL, NULL, '2026-01-10 09:00:00', '2026-01-20 20:00:00'),

-- Gubernamental 3: Local Activa (En curso)
(3, 1, 'Presupuestos Participativos Centro', 'Elección del proyecto de zona verde en el distrito centro', 'gubernamental', 'local', 'Madrid', 'Madrid', NULL, '2026-03-05 09:00:00', '2026-03-25 20:00:00'),

-- Privada 4: Grupo 1 Activa
(4, 4, 'Elección Representante Sindical', 'Votación interna de Tech Solutions', 'privada', NULL, NULL, NULL, 1, '2026-03-06 08:00:00', '2026-03-10 18:00:00'),

-- Privada 5: Grupo 2 Finalizada
(5, 6, 'Aprobación Derrama Fachada', 'Votación para aprobar el presupuesto de reparación', 'privada', NULL, NULL, NULL, 2, '2026-02-15 10:00:00', '2026-02-28 20:00:00'),

-- Privada 6: Grupo 3 Activa
(6, 4, 'Diseño de la Nueva Equipación', 'Elegir el color principal para la temporada 2026-2027', 'privada', NULL, NULL, NULL, 3, '2026-03-07 10:00:00', '2026-03-30 23:59:59');


-- 5. OPCIONES
INSERT INTO opciones (id, id_votacion, nombre_opcion, desc_opcion) VALUES
-- Opciones Votación 1 (Nacional Activa)
(1, 1, 'Partido Innovación', 'Candidatura del partido por el progreso tecnológico'),
(2, 1, 'Alianza Democrática', 'Coalición de múltiples partidos'),
(3, 1, 'Frente Cívico', 'Agrupación popular ciudadana'),
(4, 1, 'Voto en Blanco', '...'),

-- Opciones Votación 2 (Provincial Valencia Finalizada)
(5, 2, 'A favor del puente', 'Aprobar la construcción de 25M de euros'),
(6, 2, 'En contra del puente', 'Rechazar la construcción y desviar fondos'),

-- Opciones Votación 3 (Local Madrid Activa)
(7, 3, 'Parque Norte', 'Construir zona verde al norte con lago artificial'),
(8, 3, 'Plaza Central', 'Peatonalizar y arbolar completamente la plaza'),
(9, 3, 'Jardines del Sur', 'Habilitar jardines comunitarios y huertos urbanos'),

-- Opciones Votación 4 (Privada Grupo 1 Activa)
(10, 4, 'Candidatura de Laura', 'Sector de Desarrollo e IT'),
(11, 4, 'Candidatura de Marcos', 'Sector de Recursos Humanos y Finanzas'),

-- Opciones Votación 5 (Privada Grupo 2 Finalizada)
(12, 5, 'Aprobar Presupuesto A', 'Reparación completa presupuestada en 15,000€'),
(13, 5, 'Aprobar Presupuesto B', 'Reparación parcial de urgencia (8,000€)'),
(14, 5, 'Rechazar todas', 'Buscar nuevos presupuestos el mes que viene'),

-- Opciones Votación 6 (Privada Grupo 3 Activa)
(15, 6, 'Rojo y Blanco', 'Colores clásicos e históricos del equipo'),
(16, 6, 'Azul Marino y Coral', 'Nuevo diseño moderno propuesto por el patrocinador');


-- 6. VOTOS REGISTRADOS (Censo - Quién ha votado)
-- Manteniendo la coherencia estricta de elegibilidad.
INSERT INTO votos_registrados (id_votacion, id_usuario, fecha_participacion) VALUES
-- Votación 2 (Provincial Valencia finalizada). Elegibles: Provincia Valencia. 
-- Votan los usuarios 10 y 11 (Votantes de Valencia)
(2, 10, '2026-01-12 10:30:00'),
(2, 11, '2026-01-15 18:45:00'),

-- Votación 3 (Local Madrid activa). Elegibles: Ciudad Madrid.
-- Votan los usuarios 8 y 9 (Votantes de Madrid)
(3, 8, '2026-03-06 12:15:00'),
(3, 9, '2026-03-07 09:20:00'),

-- Votación 5 (Privada Grupo 2 finalizada). Miembros del grupo 2 aprobados.
-- Votan los usuarios 6, 7 y 9 que están en estado 'aprobado' en Grupo 2.
(5, 6, '2026-02-16 14:00:00'),
(5, 7, '2026-02-18 11:30:00'),
(5, 9, '2026-02-25 19:10:00'),

-- Votación 1 (Nacional activa). Todos son elegibles.
-- Votan los de Andalucía: 12 y 13.
(1, 12, '2026-03-02 08:00:00'),
(1, 13, '2026-03-05 16:30:00'),

-- Votación 4 (Privada Grupo 1 activa). Miembros Grupo 1 aprobados.
-- Votan los usuarios 4 y 8 (el 9 está en pendiente por lo que no puede votar).
(4, 4, '2026-03-06 09:10:00'),
(4, 8, '2026-03-07 10:25:00');


-- 7. VOTOS ANÓNIMOS (Urna - Qué se ha votado)
-- Exactamente la misma cantidad de votos por cada votación de arriba asegurando el anonimato.
INSERT INTO votos_anonimos (id_votacion, id_opcion, hash_integridad, fecha_voto) VALUES
-- 2 votos en Votación 2 (votan las opciones 5 y 6)
(2, 5, 'bc1q_hash_val_1a2b3c4d5e6f7g8h9i', '2026-01-12 10:30:01'),
(2, 6, 'bc1q_hash_val_9f8e7d6c5b4a3z2y1x', '2026-01-15 18:45:01'),

-- 2 votos en Votación 3 (ambos a la opción 7)
(3, 7, 'bc1q_hash_mad_z1x2c3v4b5n6m7l8k9', '2026-03-06 12:15:02'),
(3, 7, 'bc1q_hash_mad_m9n8b7v6c5x4z3a2s1', '2026-03-07 09:20:03'),

-- 3 votos en Votación 5 (votan las opciones 12, 12, 13)
(5, 12, 'bc1q_hash_prv2_q1w2e3r4t5y6u7i8', '2026-02-16 14:00:05'),
(5, 13, 'bc1q_hash_prv2_h8g7f6d5s4a3p2o1', '2026-02-18 11:30:04'),
(5, 12, 'bc1q_hash_prv2_p0o9i8u7y6t5r4e3', '2026-02-25 19:10:02'),

-- 2 votos en Votación 1 (votan las opciones 2 y 4)
(1, 2, 'bc1q_hash_nac_l1k2j3h4g5f6d7s8a9', '2026-03-02 08:00:03'),
(1, 4, 'bc1q_hash_nac_a9s8d7f6g5h4j3k2l1', '2026-03-05 16:30:01'),

-- 2 votos en Votación 4 (votan las opciones 10 y 11)
(4, 10, 'bc1q_hash_prv1_z0x9c8v7b6n5m4', '2026-03-06 09:10:01'),
(4, 11, 'bc1q_hash_prv1_m4n5b6v7c8x9z0', '2026-03-07 10:25:01');
