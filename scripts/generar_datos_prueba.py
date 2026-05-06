# Para ejecutar este script, asegúrate de instalar las dependencias necesarias:
# py -m pip install Faker bcrypt

import random
import string
import datetime
from datetime import timedelta
import bcrypt
import hmac
import hashlib
import csv
import sys
from faker import Faker

# Inicializar Faker con localización de España
fake = Faker('es_ES')

import os

def get_secret(secret_name, default_value):
    """Intenta leer un secreto de Docker Swarm, si no existe usa el valor por defecto."""
    path = f"/run/secrets/{secret_name}"
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return f.read().strip()
    return default_value

# Constantes de Seguridad y Configuración
DNI_PEPPER = get_secret("dni_pepper", "6b8821901f9587a0d33aa0dec880d2a78ccf3f9adca2523b228135d0c71ac4c5")
BLOCKCHAIN_SECRET = get_secret("blockchain_secret", "83299ee1bd7515afe3503044ceb2378952210d1d6ef4d2ac600a618ad61bb340")
PASSWORD_PLAIN = "123456"

# Optimización: Como todos los usuarios tendrán la misma contraseña plana,
# hasheamos la contraseña una sola vez al principio para acelerar la ejecución.
PASSWORD_HASH = bcrypt.hashpw(PASSWORD_PLAIN.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# Cantidades a generar
NUM_USUARIOS = 300
NUM_ORGANIZACIONES = 8
NUM_VOTACIONES = 25

def generar_dni():
    """Genera un DNI español válido (8 números y 1 letra mayúscula)."""
    num = random.randint(10000000, 99999999)
    letras = "TRWAGMYFPDXBNJZSQVHLCKE"
    letra = letras[num % 23]
    return f"{num}{letra}"

def hash_dni(dni_plain):
    """Hashea el DNI usando HMAC-SHA256 y un pepper."""
    return hmac.new(
        DNI_PEPPER.encode('utf-8'), 
        dni_plain.upper().encode('utf-8'), 
        hashlib.sha256
    ).hexdigest()

def escape_sql(text):
    """Escapa las comillas simples para evitar errores en sentencias SQL."""
    if text is None:
        return "NULL"
    return "'" + str(text).replace("'", "''") + "'"

def main():
    print("Iniciando la generación de datos...")

    # Rutas absolutas para que funcione bien dentro del contenedor Linux
    script_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(script_dir)
    db_dir = os.path.join(root_dir, 'database')
    os.makedirs(db_dir, exist_ok=True)

    sql_path = os.path.join(db_dir, 'datos_prueba.sql')
    csv_path = os.path.join(db_dir, 'datos_prueba_credenciales.csv')

    # Archivos de salida
    sql_file = open(sql_path, 'w', encoding='utf-8')
    csv_file = open(csv_path, 'w', encoding='utf-8', newline='')
    
    csv_writer = csv.writer(csv_file)
    # Cabecera del CSV
    csv_writer.writerow(['DNI', 'Nombre', 'Apellidos', 'Rol', 'Password Plana'])

    sql_file.write("-- Archivo SQL Generado Automáticamente\n")
    sql_file.write("USE db_appvotaciones;\n\n")

    # ==========================================
    # 1. GENERACIÓN DE USUARIOS
    # ==========================================
    print("Generando usuarios...")
    usuarios = []
    
    # Distribución de roles: 5 admin_gobierno, 15 admin_privado, resto votantes
    roles = ['admin_gobierno'] * 5 + ['admin_privado'] * 15 + ['votante'] * (NUM_USUARIOS - 20)
    random.shuffle(roles)

    sql_file.write("-- Insertando Usuarios\n")
    sql_file.write("INSERT INTO `usuarios` (`id`, `dni_hash`, `password`, `nombre`, `apellidos`, `email`, `num_telefono`, `provincia`, `ciudad`, `rol`) VALUES\n")

    for i in range(1, NUM_USUARIOS + 1):
        dni_plain = generar_dni()
        dni_hashed = hash_dni(dni_plain)
        nombre = fake.first_name()
        apellidos = fake.last_name() + " " + fake.last_name()
        email = fake.unique.email()
        telefono = f"6{random.randint(10000000, 99999999)}" # Número de teléfono español válido de 9 dígitos
        provincia = fake.state()
        ciudad = fake.city()
        rol = roles[i-1]

        # Guardar en memoria para relaciones futuras
        usuarios.append({
            'id': i,
            'rol': rol,
            'provincia': provincia,
            'ciudad': ciudad
        })

        # Escribir CSV
        csv_writer.writerow([dni_plain, nombre, apellidos, rol, PASSWORD_PLAIN])

        # Construir y escribir sentencia SQL
        row_sql = f"({i}, {escape_sql(dni_hashed)}, {escape_sql(PASSWORD_HASH)}, {escape_sql(nombre)}, {escape_sql(apellidos)}, {escape_sql(email)}, {escape_sql(telefono)}, {escape_sql(provincia)}, {escape_sql(ciudad)}, {escape_sql(rol)})"
        
        if i == NUM_USUARIOS:
            sql_file.write(row_sql + ";\n\n")
        else:
            sql_file.write(row_sql + ",\n")


    # ==========================================
    # 2. GENERACIÓN DE ORGANIZACIONES Y MIEMBROS
    # ==========================================
    print("Generando organizaciones y miembros...")
    sql_file.write("-- Insertando Organizaciones\n")
    sql_file.write("INSERT INTO `organizaciones` (`id`, `nombre`, `descripcion`, `sede_ciudad`, `codigo_unico`, `creado_por`) VALUES\n")

    # Filtramos usuarios que puedan ser creadores (admin_privado)
    admins_privados = [u for u in usuarios if u['rol'] == 'admin_privado']
    
    organizaciones_creadas = []
    for i in range(1, NUM_ORGANIZACIONES + 1):
        nombre_org = fake.company()
        descripcion = fake.text(max_nb_chars=200)
        sede_ciudad = fake.city()
        codigo_unico = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        creado_por = random.choice(admins_privados)['id'] if admins_privados else random.choice(usuarios)['id']

        organizaciones_creadas.append(i)

        row_sql = f"({i}, {escape_sql(nombre_org)}, {escape_sql(descripcion)}, {escape_sql(sede_ciudad)}, {escape_sql(codigo_unico)}, {creado_por})"
        
        if i == NUM_ORGANIZACIONES:
            sql_file.write(row_sql + ";\n\n")
        else:
            sql_file.write(row_sql + ",\n")

    sql_file.write("-- Asignando Miembros a Organizaciones\n")
    sql_file.write("INSERT INTO `organizacion_miembros` (`organizacion_id`, `usuario_id`, `es_admin`) VALUES\n")

    miembros_sql = []
    usuarios_ya_asignados = set()
    
    # Aseguramos que TODOS los admin_privados estén en al menos una organización y sean admins de ella
    for admin in admins_privados:
        org_id = random.choice(organizaciones_creadas)
        miembros_sql.append(f"({org_id}, {admin['id']}, true)")
        usuarios_ya_asignados.add(admin['id'])

    # Luego asignamos al resto de usuarios hasta llegar al 60% del total
    num_usuarios_restantes_necesarios = int(NUM_USUARIOS * 0.6) - len(admins_privados)
    usuarios_disponibles = [u for u in usuarios if u['id'] not in usuarios_ya_asignados]
    
    num_a_seleccionar = min(num_usuarios_restantes_necesarios, len(usuarios_disponibles))
    if num_a_seleccionar > 0:
        otros_usuarios = random.sample(usuarios_disponibles, num_a_seleccionar)
        for u in otros_usuarios:
            org_id = random.choice(organizaciones_creadas)
            # Tienen una pequeña posibilidad de ser admin de esta organización aleatoria
            es_admin = "true" if random.random() < 0.10 else "false"
            miembros_sql.append(f"({org_id}, {u['id']}, {es_admin})")

    sql_file.write(",\n".join(miembros_sql) + ";\n\n")


    # ==========================================
    # 3. GENERACIÓN DE VOTACIONES Y OPCIONES
    # ==========================================
    print("Generando votaciones y opciones...")
    sql_file.write("-- Insertando Votaciones\n")
    sql_file.write("INSERT INTO `votaciones` (`id`, `id_autor`, `titulo`, `descripcion`, `tipo`, `alcance`, `provincia_target`, `ciudad_target`, `id_grupo`, `fecha_inicio`, `fecha_final`, `cerrada`, `razon_cierre`, `estado_auditoria`, `fecha_auditoria`) VALUES\n")

    votaciones_sql = []
    opciones_pendientes = [] # (id_votacion, id_opcion_secuencial, nombre, desc)
    id_opcion_global = 1

    # Definimos la cantidad de cada estado
    # 10 activas, 10 finalizadas, 5 cerradas
    estados = ['activa']*10 + ['finalizada']*10 + ['cerrada']*5
    random.shuffle(estados)

    admins_gobierno = [u for u in usuarios if u['rol'] == 'admin_gobierno']

    for i in range(1, NUM_VOTACIONES + 1):
        estado_actual = estados[i-1]
        
        # Mezclamos si es gubernamental o privada
        tipo = random.choice(['gubernamental', 'privada'])
        id_grupo = "NULL"
        alcance = "NULL"
        provincia_target = "NULL"
        ciudad_target = "NULL"
        
        # Determinar autor y targets según tipo
        if tipo == 'gubernamental':
            autor_id = random.choice(admins_gobierno)['id'] if admins_gobierno else 1
            alcance_str = random.choice(['nacional', 'provincial', 'local'])
            alcance = escape_sql(alcance_str)
            if alcance_str in ['provincial', 'local']:
                provincia_target = escape_sql(fake.state())
            if alcance_str == 'local':
                ciudad_target = escape_sql(fake.city())
        else:
            autor_id = random.choice(admins_privados)['id'] if admins_privados else 1
            id_grupo = str(random.choice(organizaciones_creadas))
            
        titulo = fake.sentence(nb_words=6)
        descripcion = fake.paragraph()
        
        ahora = datetime.datetime.now()
        cerrada = "false"
        razon_cierre = "NULL"

        if estado_actual == 'activa':
            fecha_inicio = ahora - timedelta(days=random.randint(1, 15))
            fecha_final = ahora + timedelta(days=random.randint(5, 30))
        elif estado_actual == 'finalizada':
            fecha_inicio = ahora - timedelta(days=random.randint(30, 60))
            fecha_final = ahora - timedelta(days=random.randint(1, 15))
        elif estado_actual == 'cerrada':
            fecha_inicio = ahora - timedelta(days=random.randint(10, 30))
            fecha_final = ahora + timedelta(days=random.randint(5, 30))
            cerrada = "true"
            razones = ["Sospechas de fraude electoral", "Cancelada por el comité organizador", "Vulnerabilidad detectada en el sistema"]
            razon_cierre = escape_sql(random.choice(razones))

        f_inicio_str = escape_sql(fecha_inicio.strftime('%Y-%m-%d %H:%M:%S'))
        f_final_str = escape_sql(fecha_final.strftime('%Y-%m-%d %H:%M:%S'))

        votaciones_sql.append(f"({i}, {autor_id}, {escape_sql(titulo)}, {escape_sql(descripcion)}, {escape_sql(tipo)}, {alcance}, {provincia_target}, {ciudad_target}, {id_grupo}, {f_inicio_str}, {f_final_str}, {cerrada}, {razon_cierre}, 'pendiente', NULL)")

        # Generamos entre 2 y 5 opciones por votación
        num_opciones = random.randint(2, 5)
        for _ in range(num_opciones):
            nombre_opcion = fake.catch_phrase()
            desc_opcion = fake.sentence()
            opciones_pendientes.append((id_opcion_global, i, nombre_opcion, desc_opcion))
            id_opcion_global += 1

    sql_file.write(",\n".join(votaciones_sql) + ";\n\n")

    sql_file.write("-- Insertando Opciones de las Votaciones\n")
    sql_file.write("INSERT INTO `opciones` (`id`, `id_votacion`, `nombre_opcion`, `desc_opcion`) VALUES\n")
    
    opciones_sql = []
    for op in opciones_pendientes:
        opciones_sql.append(f"({op[0]}, {op[1]}, {escape_sql(op[2])}, {escape_sql(op[3])})")
        
    sql_file.write(",\n".join(opciones_sql) + ";\n\n")

    # ==========================================
    # 4. GENERACIÓN DE VOTOS (Censo y Urna Criptográfica)
    # ==========================================
    print("Generando votos registrados y anónimos (con integridad criptográfica)...")
    
    opciones_por_votacion = {}
    for op in opciones_pendientes:
        id_op, id_vot, _, _ = op
        if id_vot not in opciones_por_votacion:
            opciones_por_votacion[id_vot] = []
        opciones_por_votacion[id_vot].append(id_op)
    
    votos_registrados_sql = []
    votos_anonimos_sql = []
    
    sql_file.write("-- Insertando Votos Registrados (Censo)\n")
    sql_file.write("INSERT INTO `votos_registrados` (`id_votacion`, `id_usuario`, `fecha_participacion`) VALUES\n")
    
    ahora_global = datetime.datetime.now()
    
    for i in range(1, NUM_VOTACIONES + 1):
        estado_actual = estados[i-1]
        if estado_actual == 'activa':
            fecha_voto_base = ahora_global - timedelta(days=random.randint(1, 10))
        else:
            fecha_voto_base = ahora_global - timedelta(days=random.randint(20, 50))
            
        # Un número aleatorio de usuarios participan (entre 0 y el 30% de los usuarios)
        num_votos = random.randint(0, int(NUM_USUARIOS * 0.3))
        if num_votos == 0:
            continue
            
        votantes = random.sample(usuarios, num_votos)
        
        # Hash Génesis para la urna de esta votación
        genesis_str = f"genesis_votacion_{i}"
        previous_hash = hashlib.sha256(genesis_str.encode('utf-8')).hexdigest()
        
        opciones_votacion = opciones_por_votacion.get(i, [])
        if not opciones_votacion:
            continue
            
        for v in votantes:
            id_usuario = v['id']
            # Espaciamos los votos aleatoriamente a lo largo de un par de días
            fecha_voto = fecha_voto_base + timedelta(hours=random.randint(1, 48))
            f_voto_str = escape_sql(fecha_voto.strftime('%Y-%m-%d %H:%M:%S'))
            
            # Registro en el censo
            votos_registrados_sql.append(f"({i}, {id_usuario}, {f_voto_str})")
            
            # Voto Anónimo en la Urna Criptográfica
            id_opcion = random.choice(opciones_votacion)
            
            datos_papeleta = f"{i}_{id_opcion}_{previous_hash}"
            hash_integridad = hmac.new(BLOCKCHAIN_SECRET.encode('utf-8'), datos_papeleta.encode('utf-8'), hashlib.sha256).hexdigest()
            
            votos_anonimos_sql.append(f"({i}, {id_opcion}, {escape_sql(hash_integridad)})")
            
            # Siguiente eslabón de la cadena
            previous_hash = hash_integridad

    if votos_registrados_sql:
        sql_file.write(",\n".join(votos_registrados_sql) + ";\n\n")
    else:
        sql_file.write("-- No hay votos registrados\n\n")
        
    sql_file.write("-- Insertando Votos Anónimos (Urna Criptográfica)\n")
    if votos_anonimos_sql:
        sql_file.write("INSERT INTO `votos_anonimos` (`id_votacion`, `id_opcion`, `hash_integridad`) VALUES\n")
        sql_file.write(",\n".join(votos_anonimos_sql) + ";\n\n")
    else:
        sql_file.write("-- No hay votos anónimos\n\n")

    # Cerrar archivos
    sql_file.close()
    csv_file.close()

    print("¡Generación completada exitosamente!")
    print("- mock_data.sql creado.")
    print("- credenciales_prueba.csv creado.")

if __name__ == "__main__":
    main()
