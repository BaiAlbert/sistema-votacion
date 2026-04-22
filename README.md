# sistema-votacion

Sistema de Votaciones Electronicas. TFC Alberto Ramírez Fernández

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
    - Las máquinas usarán **Ubuntu Server 24.04 LTS**. Puedes descargar la ISO oficial desde [este enlace](https://ubuntu.com/download/server/thank-you?version=24.04.4&architecture=amd64&lts=true).

- **Ejecución del Script:**
    1.  Si tu máquina anfitrión es Windows, ejecuta el script de PowerShell: [`create_VMs.ps1`](/setup/VMs/create_VMs.ps1). Si estás en Linux, ejecuta la variante en bash: [`create_VMs.sh`](/setup/VMs/create_VMs.sh).
    2.  El script creará las 4 máquinas virtuales con las siguientes especificaciones: `2GB RAM`, `2 vCPUs`, `32MB VRAM`, `1 Disco VDI de 20GB`, `1 Lector CD/DVD` y `2 adaptadores de red` (NAT para internet y Red Interna "Red_Swarm" para el clúster).
    3.  Una vez creadas, el script abrirá el explorador de archivos para que selecciones la ISO de Ubuntu Server que has descargado previamente (en Linux pedirá la ruta por terminal).
    4.  Por último, te preguntará si deseas arrancar todas las máquinas a la vez **(Cuidado: esto supone una gran carga de RAM y CPU para el anfitrión)**, arrancar solo el Manager, o no arrancar ninguna.

### 2. Instalación de los Sistemas Operativos

Una vez creadas las máquinas virtuales, procederemos a instalar el sistema operativo base en cada una de ellas.

- **Pasos de instalación:**
    1.  La ISO ya debería estar montada automáticamente en el lector de cada máquina gracias al script. Inicia las máquinas para comenzar la instalación.

    2.  Durante el asistente de Ubuntu, asegúrate de configurar estos parámetros clave (el resto pueden quedar por defecto):
        - **Nombre de usuario:** `alberto-ramirez`
        - **Contraseña:** `1234`
        - **Nombre del servidor (Hostname):** `servidor-manager` _(o `servidor-db`, `servidor-worker1`, `servidor-worker2` según corresponda)_.
        - **OpenSSH Server:** MÁRCALO para instalarlo (vital para el acceso remoto).
        - **Ubuntu Server (minimized):** NO lo marques, necesitamos la versión estándar.

    3.  Una vez instalado el sistema y tras el primer reinicio, actualiza los repositorios en todas las máquinas con:

        ```bash
        sudo apt update && sudo apt upgrade -y
        ```

    4.  **Configuración de Red Estática:** Para que el clúster funcione, necesitamos fijar las IPs de la red interna. Edita el archivo de red con:

        ```bash
        sudo nano /etc/netplan/50-cloud-init.yaml
        ```

        Sustituye el contenido por el siguiente bloque de código (respeta los espacios exactamente).
        **Importante:** Asegurate de cambiar las IPs según corresponda la máquina, siguiendo la siguiente tabla.

        | Máquina              | IP enp0s3   | IP enp0s8      |
        | :------------------- | :---------- | :------------- |
        | **servidor-manager**  | `10.0.2.50` | `192.168.50.1` |
        | **servidor-db**      | `10.0.2.51` | `192.168.50.2` |
        | **servidor-worker1** | `10.0.2.52` | `192.168.50.3` |
        | **servidor-worker2** | `10.0.2.53` | `192.168.50.4` |

        ```yaml
        network:
            version: 2
            ethernets:
                enp0s3:
                    dhcp4: false
                    addresses: [10.0.2.50/24]
                    routes:
                        - to: default
                          via: 10.0.2.2
                    nameservers:
                        addresses: [1.1.1.1, 8.8.8.8]
                enp0s8:
                    dhcp4: false
                    dhcp6: false
                    addresses: [192.168.50.1/24]
        ```

    5.  Guarda el archivo (`Ctrl+O`, `Enter`, `Ctrl+X`) y aplica los cambios con:

        ```bash
        sudo netplan apply
        ```

Recuerda realizar este proceso en cada una de las 4 máquinas.

### 3. Preparación del Clúster (Accesos y Docker Swarm)

Para que el servidor Manager pueda enviar órdenes automáticas a los Workers y unirlos al clúster sin que nos pida contraseña continuamente, debemos configurar las claves SSH y descargar el código del proyecto.

**1. Configuración de claves SSH (Solo en el Manager):**
Genera una clave SSH y cópiala a los otros nodos. Cuando ejecutes `ssh-copy-id`, te pedirá la contraseña (`1234`) por última vez.

```bash
ssh-keygen -t ed25519 -C "servidor-manager" -f ~/.ssh/id_ed25519 -N ""
ssh-copy-id alberto-ramirez@192.168.50.2
ssh-copy-id alberto-ramirez@192.168.50.3
ssh-copy-id alberto-ramirez@192.168.50.4
```

Para simplificar las conexiones, crea un archivo de configuración SSH:

```bash
nano ~/.ssh/config
```

Pega la siguiente configuración dentro y guárdalo:

```text
Host servidor-db
    HostName 192.168.50.2
    User alberto-ramirez
    IdentityFile ~/.ssh/id_ed25519

Host servidor-worker1
    HostName 192.168.50.3
    User alberto-ramirez
    IdentityFile ~/.ssh/id_ed25519

Host servidor-worker2
    HostName 192.168.50.4
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

- **Pagina web princiapl:** `http://192.168.50.1`
- **Panel de Portainer:** `http://192.168.50.1/portainer` (Crea tu usuario y contraseña de administrador la primera vez que entres).
- **Panel de phpMyAdmin:** `http://192.168.50.1/phpmyadmin`
