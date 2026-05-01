#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SCRIPT DE GENERACIÓN DE DATOS DE PRUEBA (MOCK DATA) PARA SISTEMA DE VOTACIÓN
================================================================================

Objetivo: Generar un archivo mock_data.sql con datos "mock" (falsos pero realistas)
          para inicializar una base de datos MySQL de un sistema de votación.

REQUISITOS DE INSTALACIÓN (Windows):
    Para instalar las dependencias, ejecutar:
        py -m pip install Faker bcrypt

    Ejemplo de ejecución:
        py generate_mock_data.py

FUNCIONALIDAD CLAVE:
    - Generación de DNIs españoles válidos (formato NNNNNNNN+letra)
    - Hashing de contraseñas con bcrypt (password: "123456")
    - Hashing de DNIs con HMAC-SHA256 usando pepper configurable
    - Generación de ~324 usuarios distribuidos entre 8 organizaciones
    - 60% de usuarios pertenecen a 1-2 organizaciones
    - 40% de usuarios no pertenecen a ninguna organización
    - 25 votaciones: 10 activas, 15 finalizadas
    - Datos realistas en español

REGLAS DE HASHING CRÍTICAS (Compatibilidad estricta con PHP):
    - Contraseñas: Todas son "123456", hash con bcrypt
    - DNI: Hash HMAC-SHA256 con pepper configurable (ver DNI_PEPPER)

CONSTANTE CRÍTICA:
    DNI_PEPPER = "TU_PEPPER_AQUI"  # Cambiar con tu pepper real antes de ejecutar
    Para generar un pepper seguro: python3 -c "import secrets; print(secrets.token_hex(16))"

CONFIGURACIÓN DE FECHAS:
    Hoy: 2026-05-01 (fecha de simulación)
    - 10 votaciones activas (inicio pasado, fin futuro)
    - 15 votaciones finalizadas (inicio y fin en el pasado)

================================================================================
"""

import hmac
import hashlib
import bcrypt
import random
import string
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
from faker import Faker


# ============================================================================
# CONFIGURACIÓN
# ============================================================================

# 🔥 PEPPER CRÍTICO PARA HASHING DE DNIs 🔥
# Cambia este valor con tu pepper real antes de generar los datos
# Para generar un pepper seguro: python3 -c "import secrets; print(secrets.token_hex(16))"
DNI_PEPPER = "TU_PEPPER_AQUI"

# Semilla para que los datos sean deterministas (mismos datos cada vez)
SEED = 42

# Configuración de Faker
random.seed(SEED)
fake = Faker('es_ES')
fake.add_provider(fake.address)

# Configuración de fechas (hoy: 2026-05-01)
HOY = datetime(2026, 5, 1, 12, 0, 0)  # 12:00 PM del 1 de mayo - datetime completo
FECHA_SIMULACION = datetime(2026, 5, 1, 12, 0, 0)  # 12:00 PM del 1 de mayo - datetime completo

# ============================================================================
# FUNCIONES DE UTILIDAD
# ============================================================================

def calcular_letra_dni(dni_numerico: str) -> str:
    """
    Calcula la letra correspondiente a un DNI numérico según el algoritmo oficial.

    Algoritmo: Suma ponderada de los dígitos módulo 23, mapeado a letras.

    Args:
        dni_numerico: 8 dígitos numéricos (sin formato)

    Returns:
        La letra correspondiente (mayúscula)
    """
    letras_dni = "TRWAGMYFPDXBNJZSQVHLCKE"
    numeros = [int(d) for d in dni_numerico]
    suma_ponderada = sum(n * (2 ** (i % 6)) for i, n in enumerate(numeros))
    return letras_dni[suma_ponderada % 23]


def generar_dni() -> Tuple[str, str]:
    """
    Genera un DNI español válido.

    Returns:
        Tupla (dni_formateado, dni_numerico_puro)
        Ej: ("12345678Z", "12345678")
    """
    # Generar 8 dígitos numéricos
    dni_numerico = ''.join(random.choices(string.digits, k=8))
    letra = calcular_letra_dni(dni_numerico)
    dni_formateado = f"{dni_numerico}{letra}"
    return dni_formateado, dni_numerico


def hash_dni(dni: str) -> str:
    """
    Hashea el DNI usando HMAC-SHA256 con pepper configurable.

    Args:
        dni: DNI completo con letra (ej: "12345678Z")

    Returns:
        Hash hexadecimal de 64 caracteres
    """
    # Asegurarse de que el DNI esté en mayúsculas
    dni = dni.upper()
    # Hash HMAC-SHA256
    return hmac.new(
        DNI_PEPPER.encode('utf-8'),
        dni.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()


def hash_password() -> str:
    """
    Hashea la contraseña "123456" usando bcrypt.

    Returns:
        Hash bcrypt formateado para MySQL
    """
    # La contraseña plana es siempre "123456"
    password_plain = b"123456"
    # Generar salt y hash
    salt = bcrypt.gensalt(rounds=10)
    hashed = bcrypt.hashpw(password_plain, salt).decode('utf-8')
    return hashed


def generar_email(dni: str) -> str:
    """
    Genera un email basado en el DNI para consistencia.

    Args:
        dni: DNI completo

    Returns:
        Email tipo "usuario.dni@ejemplo.com"
    """
    # Extraer solo números y usar primera parte
    numeros = ''.join(filter(str.isdigit, dni))
    prefijo = numeros[:6]
    return f"{prefijo.lower()}@ejemplo.com"


def generar_telefono() -> str:
    """
    Genera un número de teléfono español válido (9 dígitos).

    Returns:
        Número de 9 dígitos (ej: "612345678")
    """
    # Empieza por 6 o 7 (móviles)
    primer_digito = random.choice(['6', '7'])
    resto = ''.join(random.choices(string.digits, k=8))
    return f"{primer_digito}{resto}"


def generar_provincia() -> str:
    """
    Devuelve una provincia española aleatoria.

    Returns:
        Nombre de provincia
    """
    provincias = [
        "Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza",
        "Málaga", "Murcia", "Palma", "Las Palmas", "Bilbao",
        "Alicante", "Córdoba", "Valladolid", "Vigo", "Gijón",
        "Granada", "Elche", "Oviedo", "Vitoria", "A Coruña",
        "Cartagena", "Fuenlabrada", "Jerez", "Torrejón", "Alcalá",
        "Pontevedra", "Santa Cruz", "Almería", "Getafe", "Alcorcón",
        "Albacete", "Sabadell", "Terrassa", "Dos Hermanas", "Santander",
        "Burgos", "Cartagena", "San Cristóbal", "Santa Cruz", "Algeciras",
        "Salamanca", "San Sebastián", "Cádiz", "Castellón", "Leganés"
    ]
    return random.choice(provincias)


def generar_ciudad(provincia: str) -> str:
    """
    Genera una ciudad correspondiente a una provincia.

    Args:
        provincia: Nombre de provincia

    Returns:
        Ciudad (capital o ciudad importante)
    """
    capitales = {
        "Madrid": "Madrid", "Barcelona": "Barcelona", "Valencia": "Valencia",
        "Sevilla": "Sevilla", "Zaragoza": "Zaragoza", "Málaga": "Málaga",
        "Murcia": "Murcia", "Palma": "Palma", "Las Palmas": "Las Palmas",
        "Bilbao": "Bilbao", "Alicante": "Alicante", "Córdoba": "Córdoba",
        "Valladolid": "Valladolid", "Vigo": "Vigo", "Gijón": "Gijón",
        "Granada": "Granada", "Elche": "Elche", "Oviedo": "Oviedo",
        "Vitoria": "Vitoria-Gasteiz", "A Coruña": "A Coruña",
        "Cartagena": "Cartagena", "Fuenlabrada": "Fuenlabrada",
        "Jerez": "Jerez de la Frontera", "Torrejón": "Torrejón de Ardoz",
        "Alcalá": "Alcalá de Henares", "Pontevedra": "Pontevedra",
        "Santa Cruz": "Santa Cruz de Tenerife", "Almería": "Almería",
        "Getafe": "Getafe", "Alcorcón": "Alcorcón", "Albacete": "Albacete",
        "Sabadell": "Sabadell", "Terrassa": "Terrassa", "Dos Hermanas": "Dos Hermanas",
        "Santander": "Santander", "Burgos": "Burgos", "San Sebastián": "San Sebastián",
        "Cádiz": "Cádiz", "Castellón": "Castellón", "Leganés": "Leganés"
    }
    return capitales.get(provincia, "Capital")


# ============================================================================
# DATOS FIJOS PARA ADMINISTRADORES
# ============================================================================

# Estos administradores tienen DNI conocido para acceso privilegiado
ADMINS_GOBIERNO = [
    {"nombre": "Carlos", "apellidos": "Gómez", "ciudad": "Madrid", "provincia": "Madrid"},
    {"nombre": "Laura", "apellidos": "Pérez", "ciudad": "Valencia", "provincia": "Valencia"},
    {"nombre": "Miguel", "apellidos": "Sánchez", "ciudad": "Sevilla", "provincia": "Andalucía"},
]

ADMINS_PRIVADOS = [
    {"nombre": "Luis", "apellidos": "Fernández", "ciudad": "Madrid", "provincia": "Madrid"},
    {"nombre": "Marta", "apellidos": "Jiménez", "ciudad": "Alicante", "provincia": "Valencia"},
    {"nombre": "Elena", "apellidos": "Ruiz", "ciudad": "Sevilla", "provincia": "Andalucía"},
    {"nombre": "Jorge", "apellidos": "Martín", "ciudad": "Madrid", "provincia": "Madrid"},
]

VOTANTES_REPARTIDOS = [
    {"ciudad": "Madrid", "provincia": "Madrid"},
    {"ciudad": "Madrid", "provincia": "Madrid"},
    {"ciudad": "Alicante", "provincia": "Valencia"},
    {"ciudad": "Alicante", "provincia": "Valencia"},
    {"ciudad": "Sevilla", "provincia": "Andalucía"},
    {"ciudad": "Sevilla", "provincia": "Andalucía"},
]


# ============================================================================
# ORGANIZACIONES
# ============================================================================

ORGANIZACIONES = [
    {
        "nombre": "Universidad de Informática",
        "descripcion": "Universidad pública líder en estudios de computación y tecnología.",
        "sede_ciudad": "Madrid",
        "codigo_unico": "UNI001"
    },
    {
        "nombre": "Ayuntamiento de Madrid",
        "descripcion": "Administración municipal de la capital de España.",
        "sede_ciudad": "Madrid",
        "codigo_unico": "MAD002"
    },
    {
        "nombre": "Sindicato de Trabajadores",
        "descripcion": "Sindicato que representa a trabajadores de diversos sectores.",
        "sede_ciudad": "Barcelona",
        "codigo_unico": "SIN003"
    },
    {
        "nombre": "Club Deportivo Triatlón",
        "descripcion": "Club deportivo especializado en pruebas de triatlón.",
        "sede_ciudad": "Sevilla",
        "codigo_unico": "CDT004"
    },
    {
        "nombre": "Tech Solutions SL",
        "descripcion": "Empresa de desarrollo de software y soluciones digitales.",
        "sede_ciudad": "Valencia",
        "codigo_unico": "TCH005"
    },
    {
        "nombre": "Asociación Vecinos Los Pinos",
        "descripcion": "Comunidad vecinal del bloque 4 en el barrio de Los Pinos.",
        "sede_ciudad": "Bilbao",
        "codigo_unico": "VEC006"
    },
    {
        "nombre": "Fundación Cultural Levante",
        "descripcion": "Fundación dedicada a promover las artes en el Levante.",
        "sede_ciudad": "Valencia",
        "codigo_unico": "FCL007"
    },
    {
        "nombre": "Cooperativa Agrícola Andaluza",
        "descripcion": "Cooperativa de agricultores en la provincia de Córdoba.",
        "sede_ciudad": "Córdoba",
        "codigo_unico": "AGR008"
    },
]


# ============================================================================
# FUNCIONES DE GENERACIÓN DE DATOS
# ============================================================================

def generar_administradores() -> List[Dict]:
    """
    Genera los administradores (gobierno y privado) con DNI hash.

    Returns:
        Lista de diccionarios con datos de usuarios administradores.
    """
    usuarios = []

    # Administradores de Gobierno (IDs 1-3)
    for idx, admin in enumerate(ADMINS_GOBIERNO, start=1):
        dni_formateado, dni_numerico = generar_dni()
        dni_hash = hash_dni(dni_formateado)
        usuarios.append({
            "id": idx,
            "dni_hash": dni_hash,
            "password": hash_password(),
            "nombre": admin["nombre"],
            "apellidos": admin["apellidos"],
            "email": generar_email(dni_formateado),
            "num_telefono": generar_telefono(),
            "provincia": admin["provincia"],
            "ciudad": admin["ciudad"],
            "rol": "admin_gobierno"
        })

    # Administradores Privados (IDs 4-7)
    for idx, admin in enumerate(ADMINS_PRIVADOS, start=4):
        dni_formateado, dni_numerico = generar_dni()
        dni_hash = hash_dni(dni_formateado)
        usuarios.append({
            "id": idx,
            "dni_hash": dni_hash,
            "password": hash_password(),
            "nombre": admin["nombre"],
            "apellidos": admin["apellidos"],
            "email": generar_email(dni_formateado),
            "num_telefono": generar_telefono(),
            "provincia": admin["provincia"],
            "ciudad": admin["ciudad"],
            "rol": "admin_privado"
        })

    return usuarios


def generar_votantes(usuarios: List[Dict]) -> List[Dict]:
    """
    Genera votantes normales distribuidos geográficamente.

    Args:
        usuarios: Lista de usuarios administradores generados

    Returns:
        Lista de diccionarios con datos de usuarios votantes.
    """
    usuarios_votantes = []
    # IDs para votantes: 8 a 331 (324 votantes en total)

    for idx, ubicacion in enumerate(VOTANTES_REPARTIDOS, start=8):
        dni_formateado, dni_numerico = generar_dni()
        dni_hash = hash_dni(dni_formateado)
        # Reutilizar ubicación cíclicamente si hay más votantes que ubicaciones
        ubicacion_idx = (idx - 8) % len(VOTANTES_REPARTIDOS)
        ubicacion_actual = VOTANTES_REPARTIDOS[ubicacion_idx]

        usuarios_votantes.append({
            "id": idx,
            "dni_hash": dni_hash,
            "password": hash_password(),
            "nombre": fake.name(),
            "apellidos": fake.last_name() + " " + fake.last_name(),
            "email": generar_email(dni_formateado),
            "num_telefono": generar_telefono(),
            "provincia": ubicacion_actual["provincia"],
            "ciudad": ubicacion_actual["ciudad"],
            "rol": "votante"
        })

    return usuarios_votantes


def generar_organizaciones() -> List[Dict]:
    """
    Genera las definiciones de las 8 organizaciones.

    Returns:
        Lista de diccionarios con datos de organizaciones.
    """
    organizaciones = []
    for idx, org in enumerate(ORGANIZACIONES, start=1):
        organizaciones.append({
            "id": idx,
            "nombre": org["nombre"],
            "descripcion": org["descripcion"],
            "sede_ciudad": org["sede_ciudad"],
            "codigo_unico": org["codigo_unico"],
            "creado_por": random.choice(range(1, 8)),  # Un admin como creador
            "fecha_creacion": FECHA_SIMULACION - timedelta(days=random.randint(1, 365))
        })

    return organizaciones


def generar_relaciones_usuario_organizacion(
    usuarios: List[Dict],
    organizaciones: List[Dict],
    admin_ids: List[int]
) -> List[Dict]:
    """
    Genera la relación entre usuarios y organizaciones.

    Reglas:
    - 60% de usuarios pertenecen a 1 o 2 organizaciones
    - 40% no pertenecen a ninguna

    Args:
        usuarios: Lista de todos los usuarios
        organizaciones: Lista de organizaciones
        admin_ids: IDs de usuarios que son admins de alguna organización

    Returns:
        Lista de diccionarios con datos de relaciones usuario-organización.
    """
    relaciones = []

    # Determinar qué usuarios son admins de organizaciones
    admin_indices = [i for i, u in enumerate(usuarios) if u["rol"] == "admin_privado"]

    for idx, usuario in enumerate(usuarios):
        usuario_idx = idx
        dni_hash = usuario["dni_hash"]

        # Admins: asignar como admin de al menos una organización
        if usuario_idx in admin_indices:
            # Este usuario es admin de al menos una organización
            org_random = random.choice(organizaciones)
            relaciones.append({
                "organizacion_id": org_random["id"],
                "usuario_id": usuario["id"],
                "es_admin": True,
                "fecha_ingreso": FECHA_SIMULACION - timedelta(days=random.randint(1, 180)),
                "dni_hash": dni_hash
            })
            # Algunos admins pueden ser de más organizaciones
            if random.random() < 0.3:
                org_random2 = random.choice(organizaciones)
                while org_random2["id"] == org_random["id"]:
                    org_random2 = random.choice(organizaciones)
                relaciones.append({
                    "organizacion_id": org_random2["id"],
                    "usuario_id": usuario["id"],
                    "es_admin": True,
                    "fecha_ingreso": FECHA_SIMULACION - timedelta(days=random.randint(1, 180)),
                    "dni_hash": dni_hash
                })
            continue

        # Votantes: 60% pertenecen a 0-2 organizaciones, 40% a ninguna
        if random.random() < 0.6:  # 60% pertenecen
            # Elegir 1 o 2 organizaciones aleatorias
            num_orgs = random.choice([1, 2])
            orgs_elegidas = []

            while len(orgs_elegidas) < num_orgs:
                org = random.choice(organizaciones)

                # Asegurar que no se repita la misma organización
                existe = any(
                    r["organizacion_id"] == org["id"] and r["usuario_id"] == usuario["id"]
                    for r in relaciones
                )
                if not existe:
                    orgs_elegidas.append(org)
                    relaciones.append({
                        "organizacion_id": org["id"],
                        "usuario_id": usuario["id"],
                        "es_admin": False,
                        "fecha_ingreso": FECHA_SIMULACION - timedelta(days=random.randint(30, 400)),
                        "dni_hash": dni_hash
                    })

    return relaciones


def generar_votaciones(
    autor_ids: List[int],
    grupo_ids: List[int]
) -> List[Dict]:
    """
    Genera 25 votaciones en total:
    - 10 activas (inicio pasado, fin futuro): 5 gubernamentales, 5 privadas
    - 15 finalizadas (inicio y fin en el pasado): 7 públicas, 8 privadas

    Args:
        autor_ids: IDs de usuarios autorizados para crear votaciones
        grupo_ids: IDs de organizaciones para votaciones privadas

    Returns:
        Lista de diccionarios con datos de votaciones.
    """
    votaciones = []
    dia_hoy = datetime(2026, 5, 1, 12, 0, 0)

    # === VOTACIONES GOBERNAMENTALES ===

    # Activas (5): 3 nacionales, 2 provinciales o locales
    gubernamentales_activas = [
        {
            "id": 1,
            "titulo": "Elecciones Generales 2026",
            "descripcion": "Elección de representantes al parlamento nacional",
            "tipo": "gubernamental",
            "alcance": "nacional",
            "provincia_target": None,
            "ciudad_target": None,
            "fecha_inicio": dia_hoy - timedelta(days=30),
            "fecha_final": dia_hoy + timedelta(days=45),
            "autor_id": autor_ids[0],
            "cerrada": False,
        },
        {
            "id": 2,
            "titulo": "Presupuestos Participativos Centro",
            "descripcion": "Elección del proyecto de zona verde en el distrito centro",
            "tipo": "gubernamental",
            "alcance": "local",
            "provincia_target": "Madrid",
            "ciudad_target": "Madrid",
            "fecha_inicio": dia_hoy - timedelta(days=10),
            "fecha_final": dia_hoy + timedelta(days=30),
            "autor_id": autor_ids[0],
            "cerrada": False,
        },
        {
            "id": 3,
            "titulo": "Referéndum Ambiental Nacional",
            "descripcion": "Consulta pública sobre políticas de sostenibilidad",
            "tipo": "gubernamental",
            "alcance": "nacional",
            "provincia_target": None,
            "ciudad_target": None,
            "fecha_inicio": dia_hoy - timedelta(days=5),
            "fecha_final": dia_hoy + timedelta(days=60),
            "autor_id": autor_ids[1],
            "cerrada": False,
        },
        {
            "id": 4,
            "titulo": "Elección Delegado Provincial",
            "descripcion": "Elección del delegado de gobierno provincial",
            "tipo": "gubernamental",
            "alcance": "provincial",
            "provincia_target": "Barcelona",
            "ciudad_target": None,
            "fecha_inicio": dia_hoy - timedelta(days=15),
            "fecha_final": dia_hoy + timedelta(days=20),
            "autor_id": autor_ids[1],
            "cerrada": False,
        },
        {
            "id": 5,
            "titulo": "Presupuestos Municipales Vallès",
            "descripcion": "Decisión sobre inversión en infraestructuras locales",
            "tipo": "gubernamental",
            "alcance": "local",
            "provincia_target": "Barcelona",
            "ciudad_target": "Badalona",
            "fecha_inicio": dia_hoy - timedelta(days=20),
            "fecha_final": dia_hoy + timedelta(days=25),
            "autor_id": autor_ids[2],
            "cerrada": False,
        },
    ]

    # Finalizadas (7): 5 nacionales/provinciales, 2 locales
    gubernamentales_finalizadas = [
        {
            "id": 6,
            "titulo": "Referéndum de Infraestructuras",
            "descripcion": "Aprobación del presupuesto para el nuevo puente de cercanías",
            "tipo": "gubernamental",
            "alcance": "provincial",
            "provincia_target": "Valencia",
            "ciudad_target": None,
            "fecha_inicio": datetime(2026, 1, 10, 9, 0),
            "fecha_final": datetime(2026, 1, 20, 20, 0),
            "autor_id": autor_ids[1],
            "cerrada": False,
        },
        {
            "id": 7,
            "titulo": "Consultoría Nacional Energía",
            "descripcion": "Decisión sobre transición energética nacional",
            "tipo": "gubernamental",
            "alcance": "nacional",
            "provincia_target": None,
            "ciudad_target": None,
            "fecha_inicio": datetime(2026, 2, 1, 9, 0),
            "fecha_final": datetime(2026, 2, 14, 20, 0),
            "autor_id": autor_ids[0],
            "cerrada": False,
        },
        {
            "id": 8,
            "titulo": "Plan de Movilidad Sostenible",
            "descripcion": "Elección de políticas de transporte público",
            "tipo": "gubernamental",
            "alcance": "nacional",
            "provincia_target": None,
            "ciudad_target": None,
            "fecha_inicio": datetime(2026, 2, 15, 9, 0),
            "fecha_final": datetime(2026, 2, 28, 20, 0),
            "autor_id": autor_ids[2],
            "cerrada": False,
        },
        {
            "id": 9,
            "titulo": "Gestión del Agua Regional",
            "descripcion": "Asignación de recursos hídricos para la agricultura",
            "tipo": "gubernamental",
            "alcance": "provincial",
            "provincia_target": "Murcia",
            "ciudad_target": None,
            "fecha_inicio": datetime(2026, 3, 1, 9, 0),
            "fecha_final": datetime(2026, 3, 15, 20, 0),
            "autor_id": autor_ids[1],
            "cerrada": False,
        },
        {
            "id": 10,
            "titulo": "Rehabilitación de Centros Educativos",
            "descripcion": "Selección de prioridades para obras escolares",
            "tipo": "gubernamental",
            "alcance": "local",
            "provincia_target": "Sevilla",
            "ciudad_target": "Sevilla",
            "fecha_inicio": datetime(2026, 3, 5, 9, 0),
            "fecha_final": datetime(2026, 3, 18, 20, 0),
            "autor_id": autor_ids[2],
            "cerrada": False,
        },
        {
            "id": 11,
            "titulo": "Turismo y Patrimonial Valenciano",
            "descripcion": "Estrategia para promoción turística regional",
            "tipo": "gubernamental",
            "alcance": "provincial",
            "provincia_target": "Valencia",
            "ciudad_target": None,
            "fecha_inicio": datetime(2026, 3, 10, 9, 0),
            "fecha_final": datetime(2026, 3, 24, 20, 0),
            "autor_id": autor_ids[1],
            "cerrada": False,
        },
        {
            "id": 12,
            "titulo": "Mercados Municipales Centro",
            "descripcion": "Modernización de mercados públicos históricos",
            "tipo": "gubernamental",
            "alcance": "local",
            "provincia_target": "Madrid",
            "ciudad_target": "Madrid",
            "fecha_inicio": datetime(2026, 3, 15, 9, 0),
            "fecha_final": datetime(2026, 3, 29, 20, 0),
            "autor_id": autor_ids[0],
            "cerrada": False,
        },
    ]

    # === VOTACIONES PRIVADAS ===

    # Activas (5) - Usamos todos los admins disponibles
    privadas_activas = [
        {
            "id": 13,
            "titulo": "Elección Representante Sindical",
            "descripcion": "Votación interna para elegir delegado de personal",
            "tipo": "privada",
            "alcance": None,
            "provincia_target": None,
            "ciudad_target": None,
            "fecha_inicio": dia_hoy - timedelta(days=2),
            "fecha_final": dia_hoy + timedelta(days=14),
            "autor_id": autor_ids[3],
            "grupo_id": grupo_ids[0],
            "cerrada": False,
        },
        {
            "id": 14,
            "titulo": "Diseño de la Nueva Equipación",
            "descripcion": "Elegir el color principal para la temporada 2026-2027",
            "tipo": "privada",
            "alcance": None,
            "provincia_target": None,
            "ciudad_target": None,
            "fecha_inicio": dia_hoy,
            "fecha_final": dia_hoy + timedelta(days=30),
            "autor_id": autor_ids[3],
            "grupo_id": grupo_ids[1],
            "cerrada": False,
        },
        {
            "id": 15,
            "titulo": "Selección de Proveedores IT",
            "descripcion": "Evaluación y elección de nuevas tecnologías",
            "tipo": "privada",
            "alcance": None,
            "provincia_target": None,
            "ciudad_target": None,
            "fecha_inicio": dia_hoy - timedelta(days=7),
            "fecha_final": dia_hoy + timedelta(days=21),
            "autor_id": autor_ids[3],
            "grupo_id": grupo_ids[2],
            "cerrada": False,
        },
        {
            "id": 16,
            "titulo": "Política de Teletrabajo",
            "descripcion": "Decisión sobre modelo híbrido de trabajo",
            "tipo": "privada",
            "alcance": None,
            "provincia_target": None,
            "ciudad_target": None,
            "fecha_inicio": dia_hoy - timedelta(days=3),
            "fecha_final": dia_hoy + timedelta(days=40),
            "autor_id": autor_ids[3],
            "grupo_id": grupo_ids[0],
            "cerrada": False,
        },
        {
            "id": 17,
            "titulo": "Evento de Fin de Año",
            "descripcion": "Elegir tema y ubicación para celebración anual",
            "tipo": "privada",
            "alcance": None,
            "provincia_target": None,
            "ciudad_target": None,
            "fecha_inicio": dia_hoy - timedelta(days=5),
            "fecha_final": dia_hoy + timedelta(days=35),
            "autor_id": autor_ids[3],
            "grupo_id": grupo_ids[3],
            "cerrada": False,
        },
    ]

    # Finalizadas (7) - Ajustado para 4 admins
    privadas_finalizadas = [
        {
            "id": 18,
            "titulo": "Aprobación Derrama Fachada",
            "descripcion": "Votación para aprobar el presupuesto de reparación",
            "tipo": "privada",
            "alcance": None,
            "provincia_target": None,
            "ciudad_target": None,
            "fecha_inicio": datetime(2026, 2, 15, 10, 0),
            "fecha_final": datetime(2026, 2, 28, 20, 0),
            "autor_id": autor_ids[3],
            "grupo_id": grupo_ids[1],
            "cerrada": False,
        },
        {
            "id": 19,
            "titulo": "Campaña de Vacunación Voluntaria",
            "descripcion": "Programa de salud comunitaria",
            "tipo": "privada",
            "alcance": None,
            "provincia_target": None,
            "ciudad_target": None,
            "fecha_inicio": datetime(2026, 1, 5, 9, 0),
            "fecha_final": datetime(2026, 1, 18, 20, 0),
            "autor_id": autor_ids[3],
            "grupo_id": grupo_ids[2],
            "cerrada": False,
        },
        {
            "id": 20,
            "titulo": "Fiestas Vecinales",
            "descripcion": "Planificación de celebraciones comunitarias",
            "tipo": "privada",
            "alcance": None,
            "provincia_target": None,
            "ciudad_target": None,
            "fecha_inicio": datetime(2026, 3, 1, 9, 0),
            "fecha_final": datetime(2026, 3, 14, 20, 0),
            "autor_id": autor_ids[3],
            "grupo_id": grupo_ids[3],
            "cerrada": False,
        },
        {
            "id": 21,
            "titulo": "Cronograma Reuniones Mensuales",
            "descripcion": "Frecuencia de reuniones del equipo",
            "tipo": "privada",
            "alcance": None,
            "provincia_target": None,
            "ciudad_target": None,
            "fecha_inicio": datetime(2026, 1, 15, 9, 0),
            "fecha_final": datetime(2026, 1, 29, 20, 0),
            "autor_id": autor_ids[3],
            "grupo_id": grupo_ids[0],
            "cerrada": False,
        },
        {
            "id": 22,
            "titulo": "Selección Proveedores IT",
            "descripcion": "Evaluación de nuevos partners tecnológicos",
            "tipo": "privada",
            "alcance": None,
            "provincia_target": None,
            "ciudad_target": None,
            "fecha_inicio": datetime(2026, 2, 1, 9, 0),
            "fecha_final": datetime(2026, 2, 15, 20, 0),
            "autor_id": autor_ids[3],
            "grupo_id": grupo_ids[2],
            "cerrada": False,
        },
        {
            "id": 23,
            "titulo": "Membresía Club Deportivo",
            "descripcion": "Renovación de socios y cuota del año",
            "tipo": "privada",
            "alcance": None,
            "provincia_target": None,
            "ciudad_target": None,
            "fecha_inicio": datetime(2026, 1, 20, 9, 0),
            "fecha_final": datetime(2026, 2, 3, 20, 0),
            "autor_id": autor_ids[3],
            "grupo_id": grupo_ids[3],
            "cerrada": False,
        },
        {
            "id": 24,
            "titulo": "Política de Retención de Personal",
            "descripcion": "Incentivos para equipo de ventas",
            "tipo": "privada",
            "alcance": None,
            "provincia_target": None,
            "ciudad_target": None,
            "fecha_inicio": datetime(2026, 2, 10, 9, 0),
            "fecha_final": datetime(2026, 2, 24, 20, 0),
            "autor_id": autor_ids[3],
            "grupo_id": grupo_ids[0],
            "cerrada": False,
        },
    ]

    # Concatenar todas las votaciones
    votaciones = gubernamentales_activas + gubernamentales_finalizadas + privadas_activas + privadas_finalizadas

    # Añadir fecha de creación y autor
    for votacion in votaciones:
        votacion["fecha_creacion"] = FECHA_SIMULACION - timedelta(days=random.randint(1, 10))
        votacion["id_autor"] = votacion["autor_id"]
        del votacion["autor_id"]

        # La fecha_final ya tiene hora definida desde la creación
        # No necesitamos ajustar nada más

    return votaciones


def generar_opciones(votaciones: List[Dict]) -> List[Dict]:
    """
    Genera las opciones para cada votación.

    Args:
        votaciones: Lista de votaciones generadas

    Returns:
        Lista de diccionarios con datos de opciones.
    """
    opciones = []
    id_contador = 1

    for votacion in votaciones:
        # Número de opciones por votación (2-4 opciones normales + 1 blanco)
        num_opciones = random.randint(2, 4)

        # Generar opciones normales (sin blanco)
        for i in range(num_opciones):
            nombre = f"Candidatura {i + 1}"
            descripcion = f"Candidatura de la lista {i + 1}"
            opciones.append({
                "id": id_contador,
                "id_votacion": votacion["id"],
                "nombre_opcion": nombre,
                "desc_opcion": descripcion
            })
            id_contador += 1

        # Añadir opción de voto en blanco
        opciones.append({
            "id": id_contador,
            "id_votacion": votacion["id"],
            "nombre_opcion": "Voto en Blanco",
            "desc_opcion": ""
        })
        id_contador += 1

    return opciones


def generar_votos_registrados(
    votaciones: List[Dict],
    organizacion_miembros: List[Dict]
) -> List[Dict]:
    """
    Genera los votos registrados (censo de votantes).

    Reglas de elegibilidad:
    - Gubernamental nacional: todos los votantes
    - Gubernamental provincial/local: usuarios de esa provincia/ciudad
    - Privada: miembros del grupo con estado 'aprobado'

    Args:
        votaciones: Lista de votaciones
        organizacion_miembros: Relaciones entre usuarios y organizaciones

    Returns:
        Lista de diccionarios con datos de votos registrados.
    """
    votos_registrados = []

    # Mapeo simplificado: usuario -> (provincia, ciudad)
    # Los IDs 1-7 son admins, IDs 8-331 son votantes
    usuarios_votantes_map = {}
    for idx in range(8, 332):
        usuarios_votantes_map[idx] = random.choice([
            ("Madrid", "Madrid"),
            ("Valencia", "Alicante"),
            ("Andalucía", "Sevilla"),
        ])

    for votacion in votaciones:
        id_votacion = votacion["id"]
        tipo = votacion["tipo"]
        alcance = votacion["alcance"]
        provincia_target = votacion["provincia_target"]
        ciudad_target = votacion["ciudad_target"]
        id_grupo = votacion.get("id_grupo")

        if tipo == "gubernamental":
            usuarios_eligibles = []

            if alcance == "nacional":
                # Todos los votantes
                usuarios_eligibles = list(range(8, 332))

            elif alcance == "provincial":
                # Usuarios de esa provincia (simulado con random)
                num_usuarios = random.randint(50, 150)
                usuarios_eligibles = [random.randint(8, 331) for _ in range(num_usuarios)]

            else:  # local
                # Usuarios de esa ciudad (simulado)
                num_usuarios = random.randint(10, 50)
                usuarios_eligibles = [random.randint(8, 331) for _ in range(num_usuarios)]

        else:  # privada
            # Solo miembros del grupo con estado 'aprobado' (no admins)
            usuarios_eligibles = [
                rel["usuario_id"]
                for rel in organizacion_miembros
                if rel["organizacion_id"] == id_grupo and rel["es_admin"] is False
            ]

            # Añadir a los admins de la organización también
            usuarios_eligibles.extend([
                u["id"]
                for u in generar_usuarios_completos()
                if u["id"] in [rel["usuario_id"] for rel in organizacion_miembros if rel["organizacion_id"] == id_grupo]
            ])

        # Seleccionar entre 30% y 100% de usuarios elegibles que votan
        if usuarios_eligibles:
            num_votos = int(len(usuarios_eligibles) * random.uniform(0.3, 0.8))
            usuarios_votantes = random.sample(usuarios_eligibles, min(num_votos, len(usuarios_eligibles)))

            for id_usuario in usuarios_votantes:
                votos_registrados.append({
                    "id_votacion": id_votacion,
                    "id_usuario": id_usuario,
                    "fecha_participacion": votacion["fecha_inicio"] + timedelta(
                        hours=random.randint(0, 23),
                        minutes=random.randint(0, 59)
                    )
                })

    return votos_registrados


def generar_votos_anonimos(
    votos_registrados: List[Dict],
    opciones: List[Dict]
) -> List[Dict]:
    """
    Genera los votos anónimos (lo que se votó).

    Args:
        votos_registrados: Lista de votos registrados
        opciones: Lista de opciones

    Returns:
        Lista de diccionarios con datos de votos anónimos.
    """
    votos_anonimos = []
    visto = set()  # Evitar duplicados de (votacion_id, opcion_id)

    for voto_reg in votos_registrados:
        id_votacion = voto_reg["id_votacion"]
        id_usuario = voto_reg["id_usuario"]

        # Obtener opciones de esta votación
        opciones_votacion = [o for o in opciones if o["id_votacion"] == id_votacion]

        # Elegir una opción aleatoria (evitando blanco)
        opciones_validas = [o for o in opciones_votacion if o["nombre_opcion"] != "Voto en Blanco"]
        if opciones_validas:
            id_opcion = random.choice(opciones_validas)["id"]

            # Crear hash único basado en usuario y voto
            hash_unico = hmac.new(
                DNI_PEPPER.encode('utf-8'),
                f"{id_votacion}_{id_opcion}".encode('utf-8'),
                hashlib.sha256
            ).hexdigest()[:64]

            voto_anonimo = {
                "id_votacion": id_votacion,
                "id_opcion": id_opcion,
                "hash_integridad": hash_unico,
                "fecha_voto": voto_reg["fecha_participacion"].replace(second=random.randint(0, 59))
            }

            # Evitar duplicados
            clave = (id_votacion, id_opcion)
            if clave not in visto:
                visto.add(clave)
                votos_anonimos.append(voto_anonimo)

    return votos_anonimos


def generar_usuarios_completos() -> List[Dict]:
    """
    Genera todos los usuarios (admins y votantes) en formato completo.

    Returns:
        Lista de diccionarios con datos de usuarios.
    """
    # Generar admins
    admins = generar_administradores()

    # Generar votantes
    votantes = generar_votantes(admins)

    return admins + votantes


def generar_usuarios_con_dni_plain(
    usuarios_base: List[Dict],
    organizaciones: List[Dict],
    admin_ids: List[int]
) -> Tuple[List[Dict], List[Dict]]:
    """
    Genera usuarios con DNI en texto plano para INSERT directo en la base de datos.

    Args:
        usuarios_base: Usuarios base sin DNI real asignado
        organizaciones: Lista de organizaciones
        admin_ids: IDs de usuarios que son admins de alguna organización

    Returns:
        Tupla (usuarios_con_dni_real, relaciones_miembros_con_dni)
    """
    usuarios_con_dni = []
    relaciones_miembros = []

    for idx, usuario in enumerate(usuarios_base):
        dni_formateado, dni_numerico = generar_dni()
        dni_hash = hash_dni(dni_formateado)

        usuario_con_dni = {
            "id": usuario["id"],
            "dni_hash": dni_hash,
            "dni_real": dni_formateado,  # Para INSERT directo
            "password": usuario["password"],
            "nombre": usuario["nombre"],
            "apellidos": usuario["apellidos"],
            "email": usuario["email"],
            "num_telefono": usuario["num_telefono"],
            "provincia": usuario["provincia"],
            "ciudad": usuario["ciudad"],
            "rol": usuario["rol"],
        }
        usuarios_con_dni.append(usuario_con_dni)

        # Generar relaciones: si es admin, es de 1-2 organizaciones
        if usuario["id"] in admin_ids:
            # Admin de al menos una organización
            num_admin_orgs = random.choice([1, 2])
            admin_orgs = random.sample(organizaciones, min(num_admin_orgs, len(organizaciones)))
            for org in admin_orgs:
                relaciones_miembros.append({
                    "organizacion_id": org["id"],
                    "usuario_id": usuario["id"],
                    "es_admin": True,
                    "fecha_ingreso": FECHA_SIMULACION - timedelta(days=random.randint(1, 180)),
                    "dni_hash": dni_hash,
                    "dni_real": dni_formateado
                })
        else:
            # Votante: 60% pertenece a 0-2 organizaciones
            if random.random() < 0.6:
                num_orgs = random.choice([1, 2])
                for _ in range(num_orgs):
                    org = random.choice(organizaciones)
                    # Evitar duplicados
                    existe = any(
                        r["usuario_id"] == usuario["id"] and r["organizacion_id"] == org["id"]
                        for r in relaciones_miembros
                    )
                    if not existe:
                        relaciones_miembros.append({
                            "organizacion_id": org["id"],
                            "usuario_id": usuario["id"],
                            "es_admin": False,
                            "fecha_ingreso": FECHA_SIMULACION - timedelta(days=random.randint(30, 400)),
                            "dni_hash": dni_hash,
                            "dni_real": dni_formateado
                        })

    return usuarios_con_dni, relaciones_miembros


def generar_relaciones_completas(
    usuarios: List[Dict],
    organizaciones: List[Dict]
) -> List[Dict]:
    """
    Genera todas las relaciones usuario-organización.

    Args:
        usuarios: Lista de usuarios
        organizaciones: Lista de organizaciones

    Returns:
        Lista de relaciones.
    """
    return generar_relaciones_usuario_organizacion(usuarios, organizaciones,
                                                    [u["id"] for u in usuarios if u["rol"] == "admin_privado"])


def generar_solicitudes_organizacion(
    organizaciones: List[Dict],
    relaciones: List[Dict],
    usuarios: List[Dict]
) -> List[Dict]:
    """
    Genera solicitudes pendientes para unirse a organizaciones.

    Args:
        organizaciones: Lista de organizaciones
        relaciones: Relaciones existentes
        usuarios: Lista de usuarios

    Returns:
        Lista de solicitudes.
    """
    solicitudes = []

    # 20% de las organizaciones tienen solicitudes pendientes
    for idx, org in enumerate(organizaciones):
        if random.random() < 0.2:
            # Buscar usuarios no miembros que podrían solicitar
            usuarios_potenciales = [
                u for u in usuarios
                if u["id"] not in [r["usuario_id"] for r in relaciones if r["organizacion_id"] == org["id"]]
            ]

            num_solicitudes = random.randint(1, 3)
            for _ in range(num_solicitudes):
                if usuarios_potenciales:
                    usuario = random.choice(usuarios_potenciales)
                    solicitudes.append({
                        "organizacion_id": org["id"],
                        "usuario_id": usuario["id"],
                        "pide_ser_admin": random.choice([True, False]),
                        "estado": "pendiente",
                        "fecha_solicitud": FECHA_SIMULACION - timedelta(days=random.randint(1, 30))
                    })

    return solicitudes


# ============================================================================
# GENERACIÓN DE SALIDA SQL
# ============================================================================

def generar_usuarios_con_dni_plain(
    usuarios_base: List[Dict],
    organizaciones: List[Dict],
    admin_ids: List[int]
) -> Tuple[List[Dict], List[Dict]]:
    """
    Genera usuarios con DNI en texto plano para INSERT directo en la base de datos.

    Args:
        usuarios_base: Usuarios base sin DNI real asignado
        organizaciones: Lista de organizaciones
        admin_ids: IDs de usuarios que son admins de alguna organización

    Returns:
        Tupla (usuarios_con_dni_real, relaciones_miembros_con_dni)
    """
    usuarios_con_dni = []
    relaciones_miembros = []

    for idx, usuario in enumerate(usuarios_base):
        dni_formateado, dni_numerico = generar_dni()
        dni_hash = hash_dni(dni_formateado)

        usuario_con_dni = {
            "id": usuario["id"],
            "dni_hash": dni_hash,
            "password": usuario["password"],
            "nombre": usuario["nombre"],
            "apellidos": usuario["apellidos"],
            "email": usuario["email"],
            "num_telefono": usuario["num_telefono"],
            "provincia": usuario["provincia"],
            "ciudad": usuario["ciudad"],
            "rol": usuario["rol"],
        }
        usuarios_con_dni.append(usuario_con_dni)

        # Generar relaciones: si es admin, es de 1-2 organizaciones
        if usuario["id"] in admin_ids:
            # Admin de al menos una organización
            num_admin_orgs = random.choice([1, 2])
            admin_orgs = random.sample(organizaciones, min(num_admin_orgs, len(organizaciones)))
            for org in admin_orgs:
                relaciones_miembros.append({
                    "organizacion_id": org["id"],
                    "usuario_id": usuario["id"],
                    "es_admin": True,
                    "fecha_ingreso": FECHA_SIMULACION - timedelta(days=random.randint(1, 180)),
                })
        else:
            # Votante: 60% pertenece a 0-2 organizaciones
            if random.random() < 0.6:
                num_orgs = random.choice([1, 2])
                for _ in range(num_orgs):
                    org = random.choice(organizaciones)
                    # Evitar duplicados
                    existe = any(
                        r["usuario_id"] == usuario["id"] and r["organizacion_id"] == org["id"]
                        for r in relaciones_miembros
                    )
                    if not existe:
                        relaciones_miembros.append({
                            "organizacion_id": org["id"],
                            "usuario_id": usuario["id"],
                            "es_admin": False,
                            "fecha_ingreso": FECHA_SIMULACION - timedelta(days=random.randint(30, 400)),
                        })

    return usuarios_con_dni, relaciones_miembros


def generar_sql_output(
    usuarios: List[Dict],
    organizaciones: List[Dict],
    relaciones: List[Dict],
    solicitudes: List[Dict],
    votaciones: List[Dict],
    opciones: List[Dict],
    votos_registrados: List[Dict],
    votos_anonimos: List[Dict]
) -> str:
    """
    Genera el archivo SQL con todas las sentencias INSERT.

    Args:
        usuarios: Lista de usuarios (con dni_hash y password)
        organizaciones: Lista de organizaciones
        relaciones: Relaciones usuario-organización
        solicitudes: Solicitudes de unión
        votaciones: Lista de votaciones
        opciones: Lista de opciones
        votos_registrados: Lista de votos registrados
        votos_anonimos: Lista de votos anónimos

    Returns:
        String SQL completo.
    """
    lines = []

    # Header
    lines.append("-- Script de Datos de Prueba (Mock Data)")
    lines.append("-- Generado automáticamente por generate_mock_data.py")
    lines.append(f"-- Fecha de simulación: {FECHA_SIMULACION.strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append("-- CONTRASENA PARA TODOS LOS USUARIOS: 123456")
    lines.append("")
    lines.append("USE db_appvotaciones;")
    lines.append("")
    lines.append("-- Limpiamos las tablas (opcional)")
    lines.append("SET FOREIGN_KEY_CHECKS = 0;")
    lines.append("TRUNCATE TABLE votos_anonimos;")
    lines.append("TRUNCATE TABLE votos_registrados;")
    lines.append("TRUNCATE TABLE opciones;")
    lines.append("TRUNCATE TABLE votaciones;")
    lines.append("TRUNCATE TABLE organizacion_solicitudes;")
    lines.append("TRUNCATE TABLE organizacion_miembros;")
    lines.append("TRUNCATE TABLE organizaciones;")
    lines.append("TRUNCATE TABLE usuarios;")
    lines.append("SET FOREIGN_KEY_CHECKS = 1;")
    lines.append("")

    # 1. Tabla: organizaciones
    lines.append("-- 1. ORGANIZACIONES")
    for org in organizaciones:
        descripcion = org['descripcion'].replace("'", "''")
        created_by = org['creado_por']
        lines.append(f"INSERT INTO organizaciones (id, nombre, descripcion, sede_ciudad, codigo_unico, creado_por, fecha_creacion) VALUES ({org['id']}, '{org['nombre']}', '{descripcion}', '{org['sede_ciudad']}', '{org['codigo_unico']}', {created_by}, '{org['fecha_creacion'].strftime('%Y-%m-%d %H:%M:%S')}');")

    lines.append("")

    # 2. Tabla: usuarios
    lines.append("-- 2. USUARIOS")
    for usuario in usuarios:
        nombre = usuario['nombre']
        apellidos = usuario['apellidos']
        email = usuario['email']
        num_telefono = usuario['num_telefono']
        provincia = usuario['provincia']
        ciudad = usuario['ciudad']
        rol = usuario['rol']
        dni_hash = usuario['dni_hash']
        password = usuario['password']

        lines.append(f"INSERT INTO usuarios (dni_hash, password, nombre, apellidos, email, num_telefono, provincia, ciudad, rol) VALUES ('{dni_hash}', '{password}', '{nombre}', '{apellidos}', '{email}', '{num_telefono}', '{provincia}', '{ciudad}', '{rol}');")

    lines.append("")

    # 3. Tabla: organizacion_miembros
    lines.append("-- 3. ORGANIZACION_MIEMBROS")
    for rel in relaciones:
        es_admin_str = "TRUE" if rel['es_admin'] else "FALSE"
        lines.append(f"INSERT INTO organizacion_miembros (organizacion_id, usuario_id, es_admin, fecha_ingreso) VALUES ({rel['organizacion_id']}, {rel['usuario_id']}, {es_admin_str}, '{rel['fecha_ingreso'].strftime('%Y-%m-%d %H:%M:%S')}');")

    lines.append("")

    # 4. Tabla: organizacion_solicitudes
    lines.append("-- 4. ORGANIZACION_SOLICITUDES")
    for solicitud in solicitudes:
        estado_sql = f"'{solicitud['estado']}'"
        pide_sql = "TRUE" if solicitud['pide_ser_admin'] else "FALSE"
        lines.append(f"INSERT INTO organizacion_solicitudes (organizacion_id, usuario_id, pide_ser_admin, estado, fecha_solicitud) VALUES ({solicitud['organizacion_id']}, {solicitud['usuario_id']}, {pide_sql}, {estado_sql}, '{solicitud['fecha_solicitud'].strftime('%Y-%m-%d %H:%M:%S')}');")

    lines.append("")

    # 5. Tabla: votaciones
    lines.append("-- 5. VOTACIONES")
    for votacion in votaciones:
        alineado = "TRUE" if votacion["cerrada"] else "FALSE"
        reason = f"NULL" if not votacion.get("razon_cierre") else f"'{votacion['razon_cierre']}'"

        # Construir cláusulas con NULL en lugar de ''
        alcance_clause = f", '{votacion['alcance']}'" if votacion["alcance"] else ", NULL"
        provincia_clause = f", '{votacion['provincia_target']}'" if votacion["provincia_target"] else ", NULL"
        ciudad_clause = f", '{votacion['ciudad_target']}'" if votacion["ciudad_target"] else ", NULL"
        grupo_clause = f", {votacion['id_grupo']}" if votacion.get("id_grupo") is not None else ", NULL"

        descripcion = votacion['descripcion'].replace("'", "''")
        title = votacion['titulo'].replace("'", "''")

        lines.append(f"INSERT INTO votaciones (id_autor, titulo, descripcion, tipo, alcance, provincia_target, ciudad_target, id_grupo, fecha_inicio, fecha_final, fecha_creacion, cerrada, razon_cierre) VALUES ({votacion['id_autor']}, '{title}', '{descripcion}', '{votacion['tipo']}'{alcance_clause}{provincia_clause}{ciudad_clause}{grupo_clause}, '{votacion['fecha_inicio'].strftime('%Y-%m-%d %H:%M:%S')}', '{votacion['fecha_final'].strftime('%Y-%m-%d %H:%M:%S')}', '{votacion['fecha_creacion'].strftime('%Y-%m-%d %H:%M:%S')}', {alineado}, {reason});")

    lines.append("")

    # 6. Tabla: opciones
    lines.append("-- 6. OPCIONES")
    for opcion in opciones:
        desc = opcion['desc_opcion'].replace("'", "''")
        lines.append(f"INSERT INTO opciones (id_votacion, nombre_opcion, desc_opcion) VALUES ({opcion['id_votacion']}, '{opcion['nombre_opcion']}', '{desc}');")

    lines.append("")

    # 7. Tabla: votos_registrados
    lines.append("-- 7. VOTOS_REGISTRADOS")
    for voto in votos_registrados:
        lines.append(f"INSERT INTO votos_registrados (id_votacion, id_usuario, fecha_participacion) VALUES ({voto['id_votacion']}, {voto['id_usuario']}, '{voto['fecha_participacion'].strftime('%Y-%m-%d %H:%M:%S')}');")

    lines.append("")

    # 8. Tabla: votos_anonimos
    lines.append("-- 8. VOTOS_ANONIMOS")
    for voto in votos_anonimos:
        lines.append(f"INSERT INTO votos_anonimos (id_votacion, id_opcion, hash_integridad, fecha_voto) VALUES ({voto['id_votacion']}, {voto['id_opcion']}, '{voto['hash_integridad']}', '{voto['fecha_voto'].strftime('%Y-%m-%d %H:%M:%S')}');")

    lines.append("")
    lines.append("-- Fin del script de datos de prueba")

    return "\n".join(lines)


def imprimir_usuarios_con_dni_plano(usuarios: List[Dict]):
    """
    Imprime por consola algunos DNIs en texto plano para pruebas de login.

    Args:
        usuarios: Lista de usuarios generados
    """
    print("=" * 80)
    print("USUARIOS GENERADOS - DNI PLANO PARA LOGIN")
    print("Contraseña para todos: 123456")
    print("=" * 80)
    print()

    # Mostrar administradores de gobierno
    print("=== ADMINISTRADORES DE GOBIERNO ===")
    for idx, usuario in enumerate(usuarios):
        if usuario["rol"] == "admin_gobierno":
            print(f"[{idx+1}] DNI: {usuario['dni_hash']}")
            print(f"    Nombre: {usuario['nombre']} {usuario['apellidos']}")
            print(f"    Email: {usuario['email']}")
            print()

    # Mostrar administradores privados
    print("=== ADMINISTRADORES PRIVADOS ===")
    for idx, usuario in enumerate(usuarios):
        if usuario["rol"] == "admin_privado":
            print(f"[{idx+1}] DNI: {usuario['dni_hash']}")
            print(f"    Nombre: {usuario['nombre']} {usuario['apellidos']}")
            print(f"    Email: {usuario['email']}")
            print()

    # Mostrar algunos votantes
    print("=== VOTANTES (primeros 15) ===")
    count = 0
    for idx, usuario in enumerate(usuarios):
        if usuario["rol"] == "votante" and count < 15:
            count += 1
            print(f"[{count}] DNI: {usuario['dni_hash']}")
            print(f"    Nombre: {usuario['nombre']} {usuario['apellidos']}")
            print(f"    Email: {usuario['email']}")
            print()

    print("=" * 80)
    print("NOTA: Estos son los DNIs reales (no hash) para login.")
    print("      El campo 'dni_hash' en la tabla de la DB es el HMAC-SHA256.")
    print("      Contraseña para TODOS: 123456")
    print("=" * 80)


def main():
    """
    Función principal que ejecuta todo el proceso de generación de datos.
    """
    print("=" * 80)
    print("GENERADOR DE DATOS DE PRUEBA PARA SISTEMA DE VOTACIÓN")
    print("=" * 80)
    print()

    # Generar usuarios base (con datos ficticios, DNI placeholder)
    print("[1/5] Generando usuarios base...")
    usuarios = generar_usuarios_completos()
    admin_ids = [u["id"] for u in usuarios if u["rol"] == "admin_privado"]
    print(f"       Generados {len(usuarios)} usuarios ({len(admin_ids)} admins privados)")
    print()

    # Imprimir DNIs planos para pruebas de login
    imprimir_usuarios_con_dni_plano(usuarios)
    print()

    # Generar organizaciones
    print("[2/5] Generando organizaciones...")
    organizaciones = generar_organizaciones()
    print(f"       Generadas {len(organizaciones)} organizaciones")
    for org in organizaciones:
        print(f"         - {org['nombre']} ({org['codigo_unico']})")
    print()

    # Generar usuarios con DNI real y relaciones
    print("[3/5] Generando usuarios con DNI real y relaciones...")
    usuarios_con_dni, relaciones = generar_usuarios_con_dni_plain(usuarios, organizaciones, admin_ids)
    print(f"       Usuarios con DNI real: {len(usuarios_con_dni)}")
    print(f"       Relaciones usuario-organización: {len(relaciones)}")

    # Estadísticas
    usuarios_con_relacion = len(set(rel["usuario_id"] for rel in relaciones))
    usuarios_sin_relacion = len(usuarios_con_dni) - usuarios_con_relacion
    print(f"       Usuarios con organización: {usuarios_con_relacion} (~{100*usuarios_con_relacion/len(usuarios_con_dni):.0f}%)")
    print(f"       Usuarios sin organización: {usuarios_sin_relacion} (~{100*usuarios_sin_relacion/len(usuarios_con_dni):.0f}%)")
    print()

    # Generar votaciones
    print("[4/5] Generando votaciones, opciones y votos...")
    grupo_ids = [org["id"] for org in organizaciones]

    votaciones = generar_votaciones(admin_ids, grupo_ids)
    print(f"       Generadas {len(votaciones)} votaciones")

    # Usar datetime completo para comparación (HOY es datetime con hora 12:00)
    activas = sum(1 for v in votaciones
                   if v["fecha_inicio"] < HOY and v["fecha_final"] > HOY)
    finalizadas = sum(1 for v in votaciones
                       if v["fecha_final"].replace(second=0, microsecond=0) < datetime(2026, 5, 1, 0, 0))
    print(f"       Activas: {activas} | Finalizadas: {finalizadas}")

    opciones = generar_opciones(votaciones)
    print(f"       Generadas {len(opciones)} opciones")

    votos_registrados = generar_votos_registrados(votaciones, relaciones)
    print(f"       Votos registrados: {len(votos_registrados)}")

    votos_anonimos = generar_votos_anonimos(votos_registrados, opciones)
    print(f"       Votos anónimos: {len(votos_anonimos)}")
    print()

    # Generar solicitudes pendientes
    print("       Generando solicitudes pendientes...")
    solicitudes = generar_solicitudes_organizacion(organizaciones, relaciones, usuarios_con_dni)
    print(f"       Solicitudes pendientes: {len(solicitudes)}")
    print()

    # Generar SQL output
    print("Generando archivo SQL de salida...")
    sql_output = generar_sql_output(
        usuarios_con_dni, organizaciones, relaciones, solicitudes,
        votaciones, opciones, votos_registrados, votos_anonimos
    )

    # Escribir archivo
    output_file = "mock_data.sql"
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(sql_output)

    print(f"¡Archivo '{output_file}' generado exitosamente!")
    print()

    # Estadísticas finales
    print("=" * 80)
    print("RESUMEN DE DATOS GENERADOS")
    print("=" * 80)
    print(f"  Usuarios:              {len(usuarios_con_dni)}")
    print(f"  Organizaciones:        {len(organizaciones)}")
    print(f"  Relaciones (N:M):      {len(relaciones)}")
    print(f"  Votaciones gubernamentales: {len([v for v in votaciones if v['tipo']=='gubernamental'])} ({activas} activas, {finalizadas} finalizadas)")
    print(f"  Votaciones privadas:      {len([v for v in votaciones if v['tipo']=='privada'])}")
    print(f"  Votaciones activas:       {activas}")
    print(f"  Votaciones finalizadas:   {finalizadas}")
    print(f"  Opciones:                {len(opciones)}")
    print(f"  Votos registrados:       {len(votos_registrados)}")
    print(f"  Votos anónimos:          {len(votos_anonimos)}")
    print(f"  Solicitudes pendientes:  {len(solicitudes)}")
    print()
    print(f"Total votaciones: {len(votaciones)} (10 activas + 15 finalizadas = {len(votaciones)})")
    print()
    print(f"Archivo de salida: {output_file}")
    print("=" * 80)


if __name__ == "__main__":
    main()
