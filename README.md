# sistema-votacion

Este proyecto es un **Sistema de Votación Electrónica** desarrollado como Trabajo de Fin de Ciclo (TFC) para el Grado Superior de ASIR. Más allá de la propia aplicación web, el verdadero núcleo del proyecto es el diseño y despliegue de una infraestructura moderna orientada a la **Alta Disponibilidad (HA)** y la resiliencia, construida sobre un clúster de **Docker Swarm** de 4 nodos.

La arquitectura integra un clúster de base de datos multi-master (**MariaDB Galera**) respaldado por un balanceador TCP (**HAProxy**), enrutamiento y seguridad web centralizada mediante **Nginx**, y una pila de monitorización en tiempo real con **Prometheus y Grafana**. Además, todo el ciclo de vida del entorno (desde el aprovisionamiento de las máquinas virtuales hasta el despliegue de los servicios y copias de seguridad) está lo más automatizado posible mediante *scripts*, aplicando principios de Infraestructura como Código (IaC).

---

# Despliegue del proyecto

## Opción 1: Despliegue mediante Importación de Máquinas Virtuales (.OVA)

Sigue estos pasos para poner en marcha el entorno completo utilizando las máquinas virtuales preconfiguradas.

### 1. Preparación y Descarga

- **Descarga:** Obtén el archivo comprimido que contiene el entorno completo en **[este enlace de Google Drive](https://drive.google.com)**.
- **Importación:** Descomprime el archivo e importa los ficheros **.ova** en VirtualBox.
    > _Nota: Las máquinas han sido exportadas usando VirtualBox versión **7.0.20**._

### 2. Verificación de Configuración

Antes de arrancar, asegúrate de que cada máquina mantenga los ajustes de red necesarios para la comunicación del clúster:

- **Adaptador 1:** Configurado en modo **NAT** (para salida a Internet).
- **Adaptador 2:** Configurado en modo **Red Interna** con el nombre `Red_Swarm`.

### 3. Puesta en Marcha

1.  Inicia las máquinas de **Ubuntu Server** seleccionando el modo **Iniciado sin pantalla (Headless Start)**.
2.  Inicia la máquina de **Windows 10** de manera normal.

### 4. Acceso y Control (SSH)

El control de los servidores se realiza desde la máquina de Windows 10 para simular un entorno de gestión real:

1.  En Windows 10, inicia sesión con la contraseña `1234`.
2.  Abre la aplicación **PuTTY**.
3.  Carga el perfil del servidor al que desees conectarte.
4.  Introduce las credenciales de acceso SSH:

| Campo          | Valor             |
| :------------- | :---------------- |
| **Usuario**    | `alberto-ramirez` |
| **Contraseña** | `1234`            |

5. Gestiona cualquiera de los 4 servidores de esta misma manera.

---

## Opción 2: Creación manual del entorno completo (Desde cero)

Esta opción te guiará para crear y configurar por ti mismo todo el entorno. Se ha intentado automatizar el proceso lo máximo posible a través del uso de scripts (los puedes encontrar en la carpeta `/setup`).

### 1. Creación de la Infraestructura (Máquinas Virtuales)

Para no tener que crear las máquinas a mano en VirtualBox, dispones de scripts de auto-aprovisionamiento.

- **Requisitos previos:** \* Se recomienda el uso de la versión **7.0.20** de VirtualBox, ya que es la que se usó durante el desarrollo y asegura máxima compatibilidad.
    - Las máquinas usarán **Ubuntu Server 26.04 LTS**. Puedes descargar la ISO oficial desde [este enlace](https://ubuntu.com/download/server/thank-you?version=26.04&architecture=amd64&lts=true).

- **Ejecución del Script:**
    1.  Si tu máquina anfitrión es Windows, ejecuta el script de PowerShell: [`create_VMs.ps1`](/setup/VMs/create_VMs.ps1). Si estás en Linux, ejecuta la variante en bash: [`create_VMs.sh`](/setup/VMs/create_VMs.sh).
    2.  El script creará las 4 máquinas virtuales con las siguientes especificaciones: `2GB RAM`, `2 vCPUs`, `32MB VRAM`, `1 Disco VDI de 20GB`, `1 Lector CD/DVD` y `2 adaptadores de red` (NAT para internet y Red Interna "Red_Swarm" para el clúster).
    3.  Una vez creadas, el script abrirá el explorador de archivos para que selecciones la ISO de Ubuntu Server que has descargado previamente (en Linux pedirá la ruta por terminal).
    4.  Por último, te preguntará si deseas arrancar todas las máquinas a la vez **(Cuidado: esto supone una gran carga de RAM y CPU para el anfitrión)**, arrancar solo el Manager, o no arrancar ninguna.


### 2. Instalación de los Sistemas Operativos

Una vez creadas las máquinas virtuales, procederemos a la instalación del sistema operativo base (Ubuntu Server) de forma totalmente automatizada.

**Pasos de instalación:**

1. **Arranque de las máquinas:** Gracias a los scripts de creación previos, tanto la ISO principal de Ubuntu como la ISO *seed* (configuración desatendida) ya están montadas en las unidades de CD/DVD de cada máquina virtual. Simplemente arranca las cuatro máquinas.
2. **Instalación desatendida (Zero-Touch):** El proceso comenzará automáticamente al detectar los archivos de Cloud-init. No es necesario realizar ninguna acción por teclado; las máquinas se configurarán y reiniciarán solas al finalizar el proceso.
3. **Comprobaciones post-instalación:** Aunque el proceso es automático, es altamente recomendable verificar que Cloud-init ha asignado correctamente los parámetros. Inicia sesión en cada máquina y utiliza los comandos `hostname` e `ip a` para contrastar los datos con la siguiente estructura:

   | Hostname de Máquina  | IP NAT (enp0s3) | IP Interna (enp0s8) |
   | :---                 | :---            | :---                |
   | **servidor-manager** | `10.0.2.50`     | `192.168.1.250`     |
   | **servidor-db**      | `10.0.2.51`     | `192.168.1.249`     |
   | **servidor-worker1** | `10.0.2.52`     | `192.168.1.248`     |
   | **servidor-worker2** | `10.0.2.53`     | `192.168.1.247`     |

4. **Resolución de problemas:** En caso de que algún parámetro de red sea erróneo, puedes modificarlo editando el archivo de configuración con `sudo nano /etc/netplan/50-cloud-init.yaml`. Tras guardar los cambios, aplica la nueva configuración ejecutando el comando `sudo netplan apply`.

5. **Limpieza de medios (IMPORTANTE):** Tras verificar que la instalación es correcta, apaga las máquinas virtuales de forma ordenada (por ejemplo, con `sudo poweroff`). Antes de volver a encenderlas, asegúrate de **EXPULSAR la ISO *seed*** de las unidades ópticas virtuales. Mantener este archivo insertado es una mala práctica que puede generar retrasos en el arranque o conflictos con el servicio Cloud-init.

### 3. Preparación del Clúster (Accesos y Docker Swarm)

Para que el servidor Manager pueda enviar órdenes automáticas a los Workers y unirlos al clúster sin que nos pida contraseña continuamente, debemos configurar las claves SSH y descargar el código del proyecto.

**1. Configuración de claves SSH (Solo en el Manager):**
Genera una clave SSH y cópiala a los otros nodos. Cuando ejecutes `ssh-copy-id`, te pedirá la contraseña (`1234`) por última vez.

```bash
ssh-keygen -t ed25519 -C "servidor-manager" -f ~/.ssh/id_ed25519 -N ""
ssh-copy-id alberto-ramirez@192.168.1.249
ssh-copy-id alberto-ramirez@192.168.1.248
ssh-copy-id alberto-ramirez@192.168.1.247
```

Para simplificar las conexiones, crea un archivo de configuración SSH:

```bash
nano ~/.ssh/config
```

Pega la siguiente configuración dentro y guárdalo:

```text
Host servidor-db
    HostName 192.168.1.249
    User alberto-ramirez
    IdentityFile ~/.ssh/id_ed25519

Host servidor-worker1
    HostName 192.168.1.248
    User alberto-ramirez
    IdentityFile ~/.ssh/id_ed25519

Host servidor-worker2
    HostName 192.168.1.247
    User alberto-ramirez
    IdentityFile ~/.ssh/id_ed25519
```

**2. Descarga del Proyecto:**
Iremos a la carpeta `/opt` (el estándar en Linux para aplicaciones de terceros) y clonaremos el repositorio oficial:

```bash
cd /opt
sudo git clone https://github.com/BaiAlbert/sistema-votacion.git
cd sistema-votacion
```

**3. Dar permisos y crear el Clúster Swarm:**
Habilitamos la ejecución de todos los scripts y lanzamos el primero, que se encargará de instalar Docker en las máquinas y formar el clúster:

```bash
sudo chmod +x setup/*.sh
sudo ./setup/1_docker_swarm.sh
```

> **Atención:** _Mantente atento a la pantalla durante la ejecución de los scripts, ya que en algunos puntos se te requerirá introducir contraseñas de `sudo` o confirmar acciones._

### 4. Despliegue de la Aplicación (Scripts Automáticos)

Con el clúster Swarm operativo, solo queda ejecutar los scripts restantes en orden para levantar la infraestructura completa. Asegúrate de seguir en la ruta `/opt/sistema-votacion`.

1. **Despliegue del Registry Local:** (Para almacenar nuestras imágenes de Docker)
    ```bash
    sudo ./setup/2_registry.sh
    ```
2. **Despliegue de Portainer:** (Interfaz gráfica para gestionar Docker)
    ```bash
    sudo ./setup/3_portainer.sh
    ```
3. **Despliegue de la Aplicación Principal:** (Base de datos, Backend, Frontend y Proxy Nginx)
    ```bash
    sudo ./setup/4_app.sh
    ```
    > **Atención:** _De nuevo mantente atento a la pantalla durante la ejecución de los scripts, ya que en algunos puntos se te requerirá introducir contraseñas de `sudo` o confirmar acciones._

### 5. Verificación y Pruebas

Para garantizar que el despliegue ha sido un éxito y que el sistema cuenta con alta disponibilidad, realizaremos las siguientes comprobaciones desde la terminal del **Manager**:

**1. Verificar el estado del Clúster:**
Ejecuta el siguiente comando para ver si los 4 nodos están activos y listos:

```bash
sudo docker node ls
```

_(Debes ver un nodo marcado como `Leader` y otros tres como `Active`)_.

**2. Verificar los Servicios (Contenedores):**
Comprueba que todos los servicios de la aplicación están encendidos y replicados:

```bash
sudo docker service ls
```

_(Fíjate en la columna `REPLICAS`. Si un servicio dice `2/2` o `1/1`, significa que está funcionando al 100%)._

**3. Pruebas de acceso web (Desde tu navegador en Windows 10):**
Abre tu navegador web y comprueba los siguientes accesos:

- **Página web principal:** `http://192.168.50.1`
- **Panel de Portainer:** `http://192.168.50.1/portainer` (Crea tu usuario y contraseña de administrador la primera vez que entres).
- **Panel de phpMyAdmin:** `http://192.168.50.1/phpmyadmin`
- **Panel de Grafana:** `http://192.168.50.1/grafana/` (User: admin, Pass: Admin)
- **Panel de HAProxy:** `http://192.168.50.1:8404/stats`

---

# Gestión del Ciclo de Vida del Entorno (Apagado y Encendido Seguro)

La arquitectura de este proyecto incluye componentes críticos con estado (*stateful*), como el clúster MariaDB Galera y el stack de monitorización (Prometheus y Grafana). Al utilizar volúmenes persistentes, un apagado abrupto de las máquinas virtuales puede provocar corrupción de datos o la desincronización total del clúster. 

Por ello, el apagado y encendido del entorno debe realizarse de manera ordenada mediante los scripts proporcionados.

### 1. Preparación previa
Asegúrate de haber otorgado permisos de ejecución a todos los scripts de la carpeta (esto solo es necesario la primera vez):
```bash
sudo chmod +x ./scripts/*.sh
```

### 2. Procedimiento de Apagado (Shutdown)

> **ATENCIÓN:** Nunca apagues las máquinas virtuales "a lo bruto" desde VirtualBox sin haber detenido antes los servicios con los scripts proporcionados.

Desde la terminal del **Manager**, ejecuta el script de apagado ([`apagar_servicios.sh`](/scripts/apagar_servicios.sh)). Este script se encargará de reducir las réplicas a 0 y detener los contenedores críticos de manera controlada y en el orden correcto.

```bash
sudo ./scripts/apagar_servicios.sh
```

Espera a que el script finalice y muestre el mensaje **Ya puedes apagar las maquinas**. A continuación, apaga los nodos *workers* remotamente y, por último, el nodo *manager*:

```bash
# Apagar los Workers remotamente (pedirá la contraseña de sudo de cada nodo)
ssh -t servidor-worker2 "sudo shutdown -h now"
ssh -t servidor-worker1 "sudo shutdown -h now"
ssh -t servidor-db "sudo shutdown -h now"

# Apagar el Manager (máquina actual)
sudo shutdown -h now
```

### 3. Procedimiento de Encendido (Startup)

Para volver a levantar el entorno, primero inicia las 4 máquinas virtuales desde VirtualBox. Espera un par de minutos para que los sistemas operativos y Docker Engine arranquen por completo.

A continuación, desde la terminal del **Manager**, ejecuta el script de encendido ([`encender_servicios.sh`](/scripts/encender_servicios.sh)):

```bash
sudo ./scripts/encender_servicios.sh
```

## ¿Por qué es tan importante este proceso?
El componente más sensible de esta infraestructura es el **clúster MariaDB Galera**. En Galera, cuando los nodos se detienen, el último nodo en apagarse registra en su estado interno el valor `safe_to_bootstrap: 1`. 

Si los nodos se apagan de golpe (por ejemplo, cortando la corriente de las VMs), es muy probable que ningún nodo registre este estado de seguridad. Si esto ocurre, al volver a encenderlos, el clúster entrará en pánico por miedo a la corrupción de datos (*split-brain*) y no arrancará por sí solo, requiriendo una intervención manual de recuperación avanzada. Estos scripts automatizan el proceso de apagado secuencial para garantizar que el clúster siempre se cierre de forma consistente y segura.