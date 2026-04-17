#!/bin/bash

# Colores para los mensajes (equivalente a -ForegroundColor)
YELLOW='\e[33m'
CYAN='\e[36m'
GREEN='\e[32m'
RED='\e[31m'
MAGENTA='\e[35m'
RESET='\e[0m'

# ==========================================
# Configuración General
# ==========================================
RAM=2048
CPUS=2
DISK_SIZE=15360
OS_TYPE="Ubuntu_64"
VBOX="vboxmanage" # En Ubuntu, vboxmanage se llama en minúsculas y está en el PATH

# Lista de las 4 máquinas que vamos a crear
VM_NAMES=("Test-App_Manager" "Test-App_DB" "Test-App_Worker1" "Test-App_Worker2")

# ==========================================
# PASO 1: Pedir al usuario la ISO de Ubuntu Server 24 LTS
# ==========================================
echo -e "${CYAN}Abriendo asistente para la ISO de Ubuntu...${RESET}"
echo -e "Por favor, indica la ruta de la ISO de Ubuntu Server 24 LTS (Se usará para todas las VMs)."

# Bucle para asegurar que el usuario mete una ruta válida
while true; do
    read -p "Ruta completa de la ISO (ej. /home/tu_usuario/Descargas/ubuntu-24.04.iso): " ISO_PATH
    
    # Comprobar si el archivo existe (-f)
    if [[ -f "$ISO_PATH" ]]; then
        echo -e "${GREEN}ISO seleccionada correctamente: $ISO_PATH${RESET}"
        break
    else
        echo -e "${RED}Error: La ruta no existe o el archivo no es válido. Inténtalo de nuevo.${RESET}"
    fi
done

# ==========================================
# PASO 2: Bucle de creación de VMs
# ==========================================
for NAME in "${VM_NAMES[@]}"; do
    echo -e "\n${MAGENTA}--------------------------------------------------${RESET}"
    echo -e "${YELLOW}Creando y configurando $NAME...${RESET}"

    # Crear VM
    $VBOX createvm --name "$NAME" --ostype "$OS_TYPE" --register

    # Rutas dinámicas para la VM actual
    # Usamos grep y cut para simular el Select-String y Split de PowerShell
    VM_CONFIG_PATH=$($VBOX showvminfo "$NAME" --machinereadable | grep "^CfgFile=" | cut -d '"' -f 2)
    VM_DIR=$(dirname "$VM_CONFIG_PATH")
    DISK_PATH="$VM_DIR/$NAME.vdi"

    # Hardware y Red
    $VBOX modifyvm "$NAME" --memory $RAM --cpus $CPUS --vram 32 --nic1 nat --nic2 intnet --intnet2 "Red_Swarm" --graphicscontroller vmsvga

    # Disco Duro
    echo "Creando disco en: $VM_DIR"
    $VBOX createmedium disk --filename "$DISK_PATH" --size $DISK_SIZE --format VDI 2>&1
    $VBOX storagectl "$NAME" --name "SATA" --add sata --controller IntelAhci --hostiocache on
    $VBOX storageattach "$NAME" --storagectl "SATA" --port 0 --device 0 --type hdd --medium "$DISK_PATH" --nonrotational on

    # Lector CD/DVD con la ISO ya montada
    $VBOX storagectl "$NAME" --name "IDE" --add ide
    $VBOX storageattach "$NAME" --storagectl "IDE" --port 1 --device 0 --type dvddrive --medium "$ISO_PATH"

    echo -e "${GREEN}$NAME está lista.${RESET}"
done

# ==========================================
# PASO 3: Menú de arranque de las máquinas recién creadas
# ==========================================
echo -e "\n${CYAN}==================================================${RESET}"
echo -e "${GREEN}Las 4 máquinas han sido creadas exitosamente.${RESET}"
echo -e "${YELLOW}¿Qué deseas hacer ahora?${RESET}"
echo "1. No arrancar ninguna máquina (Salir)."
echo "2. Arrancar SOLO la principal (Test-App_Manager)."
echo -e "${RED}3. Arrancar TODAS (ATENCIÓN: Posible alta carga para el sistema anfitrión).${RESET}"

read -p "Elige una opción (1, 2 o 3): " opcion

case $opcion in
    2)
        echo -e "${GREEN}Iniciando Test-App_Manager...${RESET}"
        $VBOX startvm "Test-App_Manager" --type gui
        ;;
    3)
        echo -e "${RED}Iniciando TODAS las máquinas...${RESET}"
        for NAME in "${VM_NAMES[@]}"; do
            echo -e "${GREEN}Iniciando $NAME...${RESET}"
            $VBOX startvm "$NAME" --type gui
            sleep 4 # Pausa de 4 segundos para no agobiar la CPU del host
        done
        ;;
    *)
        echo -e "${CYAN}No se arrancará ninguna máquina. Recuerda realizar la instalación del SO.${RESET}"
        ;;
esac