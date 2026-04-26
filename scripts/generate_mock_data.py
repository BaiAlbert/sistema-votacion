import random
import string
import hashlib
from datetime import datetime, timedelta
import os

# Configuraciones
NUM_USERS = 50
NUM_ORGANIZACIONES = 5
NUM_VOTACIONES = 10
OUTPUT_FILE = './database/3_mock_data_generated.sql'

# Datos base
nombres = ['Carlos', 'Laura', 'Miguel', 'Luis', 'Marta', 'Elena', 'Jorge', 'Ana', 'Pedro', 'Sofia', 'Pablo', 'Lucia', 'Diego', 'Carmen', 'Raul', 'Isabel', 'Antonio', 'Maria', 'David', 'Jose']
apellidos = ['Gomez', 'Perez', 'Sanchez', 'Fernandez', 'Jimenez', 'Ruiz', 'Martin', 'Lopez', 'Diaz', 'Martinez', 'Garcia', 'Herrera', 'Torres', 'Ramirez', 'Navarro', 'Dominguez', 'Romero', 'Rubio', 'Molina', 'Delgado']
provincias = ['Madrid', 'Valencia', 'Andalucia', 'Cataluña', 'Galicia', 'Pais Vasco', 'Castilla y Leon', 'Aragon']
ciudades = {
    'Madrid': ['Madrid', 'Móstoles', 'Alcalá', 'Fuenlabrada'],
    'Valencia': ['Valencia', 'Alicante', 'Castellón', 'Gandía'],
    'Andalucia': ['Sevilla', 'Málaga', 'Córdoba', 'Granada'],
    'Cataluña': ['Barcelona', 'Tarragona', 'Girona', 'Lleida'],
    'Galicia': ['Vigo', 'A Coruña', 'Ourense', 'Lugo'],
    'Pais Vasco': ['Bilbao', 'San Sebastián', 'Vitoria', 'Barakaldo'],
    'Castilla y Leon': ['Valladolid', 'Burgos', 'Salamanca', 'Leon'],
    'Aragon': ['Zaragoza', 'Huesca', 'Teruel', 'Calatayud']
}

def random_date(start, end):
    return start + timedelta(seconds=random.randint(0, int((end - start).total_seconds())))

def generar_codigo_unico():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

def generate_mock_data():
    print(f"Generando {NUM_USERS} usuarios, {NUM_ORGANIZACIONES} organizaciones, y {NUM_VOTACIONES} votaciones...")
    sql_lines = [
        "-- Datos de prueba",
        "-- Contraseñas: El hash bcrypt utilizado equivale a '123456'.",
        "",
        "USE db_appvotaciones;",
        "",
        "SET NAMES 'utf8mb4' COLLATE 'utf8mb4_es_0900_ai_ci';",
        "",
        "SET FOREIGN_KEY_CHECKS = 0;",
        "TRUNCATE TABLE `votos_anonimos`;",
        "TRUNCATE TABLE `votos_registrados`;",
        "TRUNCATE TABLE `opciones`;",
        "TRUNCATE TABLE `votaciones`;",
        "TRUNCATE TABLE `organizacion_solicitudes`;",
        "TRUNCATE TABLE `organizacion_miembros`;",
        "TRUNCATE TABLE `organizaciones`;",
        "TRUNCATE TABLE `usuarios_grupos`;",
        "TRUNCATE TABLE `grupos`;",
        "TRUNCATE TABLE `usuarios`;",
        "SET FOREIGN_KEY_CHECKS = 1;",
        ""
    ]

    # 1. USUARIOS
    sql_lines.append("-- 1. USUARIOS")
    users = []
    # 2 admin_gobierno
    for i in range(2):
        users.append({'rol': 'admin_gobierno', 'id': len(users) + 1})
    # 3 admin_privado (para los grupos antiguos o simplemente votantes ahora)
    for i in range(3):
        users.append({'rol': 'admin_privado', 'id': len(users) + 1})
    # Resto votantes
    for i in range(NUM_USERS - 5):
        users.append({'rol': 'votante', 'id': len(users) + 1})

    for user in users:
        dni = f"{random.randint(10000000, 99999999)}{random.choice(string.ascii_uppercase)}"
        dni_hash = hashlib.sha256(dni.encode()).hexdigest()
        password = "$2y$10$fedjXy3MLNjDguwZZkf4Ie.7kab4/YGmtYdPhBJgZn1ipiM3avZJy" # 123456
        nombre = random.choice(nombres)
        apellido = random.choice(apellidos)
        email = f"{nombre.lower()}.{apellido.lower()}{user['id']}@test.com"
        telefono = f"6{random.randint(00000000, 99999999)}"
        provincia = random.choice(provincias)
        ciudad = random.choice(ciudades[provincia])
        user['provincia'] = provincia
        user['ciudad'] = ciudad
        
        sql = f"INSERT INTO usuarios (id, dni_hash, password, nombre, apellidos, email, num_telefono, provincia, ciudad, rol) VALUES ({user['id']}, '{dni_hash}', '{password}', '{nombre}', '{apellido}', '{email}', '{telefono}', '{provincia}', '{ciudad}', '{user['rol']}');"
        sql_lines.append(sql)

    sql_lines.append("")

    # 2. ORGANIZACIONES
    sql_lines.append("-- 2. ORGANIZACIONES")
    organizaciones = []
    tipos_org = ['Asociación', 'Empresa', 'Sindicato', 'Comunidad', 'Club']
    for i in range(NUM_ORGANIZACIONES):
        creador_id = random.randint(1, NUM_USERS)
        provincia_org = random.choice(provincias)
        ciudad_org = random.choice(ciudades[provincia_org])
        nombre_org = f"{random.choice(tipos_org)} {random.choice(apellidos)} {random.randint(1, 99)}"
        org = {
            'id': i + 1,
            'nombre': nombre_org,
            'sede': ciudad_org,
            'creado_por': creador_id
        }
        organizaciones.append(org)
        codigo_unico = generar_codigo_unico()
        
        sql = f"INSERT INTO organizaciones (id, nombre, descripcion, sede_ciudad, codigo_unico, creado_por) VALUES ({org['id']}, '{org['nombre']}', 'Descripción genérica para {org['nombre']}', '{org['sede']}', '{codigo_unico}', {creador_id});"
        sql_lines.append(sql)
        
    sql_lines.append("")

    # 3. ORGANIZACION MIEMBROS
    sql_lines.append("-- 3. ORGANIZACION_MIEMBROS")
    miembros_set = set()
    for org in organizaciones:
        # El creador es admin
        sql_lines.append(f"INSERT INTO organizacion_miembros (organizacion_id, usuario_id, es_admin) VALUES ({org['id']}, {org['creado_por']}, 1);")
        miembros_set.add((org['id'], org['creado_por']))
        
        # Añadir entre 3 y 10 miembros aleatorios a la organización
        num_miembros = random.randint(3, 10)
        for _ in range(num_miembros):
            user_id = random.randint(1, NUM_USERS)
            if (org['id'], user_id) not in miembros_set:
                miembros_set.add((org['id'], user_id))
                es_admin = 1 if random.random() > 0.8 else 0
                sql_lines.append(f"INSERT INTO organizacion_miembros (organizacion_id, usuario_id, es_admin) VALUES ({org['id']}, {user_id}, {es_admin});")
                
    sql_lines.append("")
    
    # 4. ORGANIZACION SOLICITUDES
    sql_lines.append("-- 4. ORGANIZACION_SOLICITUDES")
    for org in organizaciones:
        for _ in range(random.randint(0, 3)):
            user_id = random.randint(1, NUM_USERS)
            if (org['id'], user_id) not in miembros_set:
                pide_admin = 1 if random.random() > 0.8 else 0
                estado = random.choice(['pendiente', 'denegada'])
                sql_lines.append(f"INSERT INTO organizacion_solicitudes (organizacion_id, usuario_id, pide_ser_admin, estado) VALUES ({org['id']}, {user_id}, {pide_admin}, '{estado}');")

    sql_lines.append("")

    # 5. VOTACIONES
    sql_lines.append("-- 5. VOTACIONES")
    votaciones = []
    for i in range(NUM_VOTACIONES):
        es_privada = random.choice([True, False])
        if es_privada:
            tipo = 'privada'
            org = random.choice(organizaciones)
            id_grupo = org['id']
            # Para crear una votación, debe ser de un admin de esa org (o creador)
            id_autor = org['creado_por']
            alcance = 'NULL'
            provincia_t = 'NULL'
            ciudad_t = 'NULL'
            titulo = f"Votación Interna {org['nombre']}"
        else:
            tipo = 'gubernamental'
            id_grupo = 'NULL'
            id_autor = random.choice([u['id'] for u in users if u['rol'] == 'admin_gobierno'])
            alcance = random.choice(['nacional', 'provincial', 'local'])
            if alcance == 'nacional':
                provincia_t = 'NULL'
                ciudad_t = 'NULL'
                titulo = "Elecciones Nacionales Generales"
            elif alcance == 'provincial':
                provincia_raw = random.choice(provincias)
                provincia_t = f"'{provincia_raw}'"
                ciudad_t = 'NULL'
                titulo = f"Referéndum Provincial de {provincia_raw}"
            else:
                provincia = random.choice(provincias)
                provincia_t = f"'{provincia}'"
                ciudad_raw = random.choice(ciudades[provincia])
                ciudad_t = f"'{ciudad_raw}'"
                titulo = f"Presupuestos Participativos {ciudad_raw}"
        
        # Fechas
        now = datetime.now()
        estado_tiempo = random.choice(['pasada', 'activa', 'futura'])
        if estado_tiempo == 'pasada':
            start = random_date(now - timedelta(days=60), now - timedelta(days=30))
            end = start + timedelta(days=15)
        elif estado_tiempo == 'activa':
            start = random_date(now - timedelta(days=10), now - timedelta(days=1))
            end = start + timedelta(days=15)
        else:
            start = random_date(now + timedelta(days=1), now + timedelta(days=10))
            end = start + timedelta(days=15)

        start_str = start.strftime('%Y-%m-%d %H:%M:%S')
        end_str = end.strftime('%Y-%m-%d %H:%M:%S')

        vot = {
            'id': i + 1,
            'id_autor': id_autor,
            'titulo': titulo,
            'tipo': tipo,
            'alcance': alcance.replace("'", "") if alcance != 'NULL' else None,
            'provincia_target': provincia_t.replace("'", "") if provincia_t != 'NULL' else None,
            'ciudad_target': ciudad_t.replace("'", "") if ciudad_t != 'NULL' else None,
            'id_grupo': id_grupo,
            'fecha_inicio': start,
            'fecha_final': end
        }
        votaciones.append(vot)
        
        alcance_str = f"'{alcance}'" if alcance != 'NULL' else 'NULL'
        
        sql = f"INSERT INTO votaciones (id, id_autor, titulo, descripcion, tipo, alcance, provincia_target, ciudad_target, id_grupo, fecha_inicio, fecha_final) VALUES ({vot['id']}, {id_autor}, '{titulo}', 'Descripción de prueba', '{tipo}', {alcance_str}, {provincia_t}, {ciudad_t}, {id_grupo}, '{start_str}', '{end_str}');"
        sql_lines.append(sql)

    sql_lines.append("")

    # 6. OPCIONES
    sql_lines.append("-- 6. OPCIONES")
    opciones_map = {} # votacion_id -> [opcion_id]
    opcion_id_counter = 1
    for vot in votaciones:
        opciones_map[vot['id']] = []
        num_opciones = random.randint(2, 4)
        for j in range(num_opciones):
            sql_lines.append(f"INSERT INTO opciones (id, id_votacion, nombre_opcion, desc_opcion) VALUES ({opcion_id_counter}, {vot['id']}, 'Opción {j+1}', 'Detalles de opción {j+1}');")
            opciones_map[vot['id']].append(opcion_id_counter)
            opcion_id_counter += 1

    sql_lines.append("")

    # 7. VOTOS
    sql_lines.append("-- 7. VOTOS REGISTRADOS Y ANONIMOS")
    for vot in votaciones:
        if vot['fecha_inicio'] > datetime.now():
            continue # Votación en el futuro, no hay votos
        
        # Determinar elegibles
        elegibles = []
        if vot['tipo'] == 'privada':
            org_id = vot['id_grupo']
            elegibles = [u_id for o_id, u_id in miembros_set if o_id == org_id]
        else:
            for u in users:
                if vot['alcance'] == 'nacional':
                    elegibles.append(u['id'])
                elif vot['alcance'] == 'provincial' and u['provincia'] == vot['provincia_target']:
                    elegibles.append(u['id'])
                elif vot['alcance'] == 'local' and u['ciudad'] == vot['ciudad_target']:
                    elegibles.append(u['id'])
                    
        # Simular algunos votos
        num_votos = min(len(elegibles), random.randint(0, len(elegibles)))
        votantes = random.sample(elegibles, num_votos)
        
        for u_id in votantes:
            # Fecha de voto entre inicio y min(fin, ahora)
            end_voto = vot['fecha_final'] if vot['fecha_final'] < datetime.now() else datetime.now()
            fecha_voto = random_date(vot['fecha_inicio'], end_voto).strftime('%Y-%m-%d %H:%M:%S')
            
            sql_lines.append(f"INSERT INTO votos_registrados (id_votacion, id_usuario, fecha_participacion) VALUES ({vot['id']}, {u_id}, '{fecha_voto}');")
            
            # Voto anónimo
            opcion_elegida = random.choice(opciones_map[vot['id']])
            hash_int = hashlib.sha256(f"{vot['id']}_{opcion_elegida}_{random.random()}".encode()).hexdigest()
            sql_lines.append(f"INSERT INTO votos_anonimos (id_votacion, id_opcion, hash_integridad, fecha_voto) VALUES ({vot['id']}, {opcion_elegida}, '{hash_int}', '{fecha_voto}');")

    # Crear directorio si no existe
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write("\n".join(sql_lines))

    print(f"✅ ¡Datos mockeados con éxito en {OUTPUT_FILE}!")

if __name__ == "__main__":
    generate_mock_data()
