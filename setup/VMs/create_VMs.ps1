# ==========================================
# Configuración General
# ==========================================
$RAM = 2048
$CPUS = 2
$DISK_SIZE = 15360
$OS_TYPE = "Ubuntu_64"
$VBOX = "C:\Program Files\Oracle\VirtualBox\VBoxManage.exe"

# Lista de las 4 máquinas que vamos a crear
$VM_Names = @("Test-App_Manager", "Test-App_DB", "Test-App_Worker1", "Test-App_Worker2")

# ==========================================
# PASO 1: Pedir al usuario la ISO de Ubuntu Server 24 LTS
# ==========================================
Write-Host "Abriendo el explorador para seleccionar la ISO de Ubuntu..." -ForegroundColor Cyan
Add-Type -AssemblyName System.Windows.Forms
$FileBrowser = New-Object System.Windows.Forms.OpenFileDialog
$FileBrowser.Title = "Selecciona la ISO de Ubuntu Server 24 LTS (Se usará para todas las VMs)"
$FileBrowser.Filter = "Archivos ISO (*.iso)|*.iso|Todos los archivos (*.*)|*.*"
$FileBrowser.InitialDirectory = [Environment]::GetFolderPath("UserProfile") + "\Downloads"

$DialogResult = $FileBrowser.ShowDialog()

if ($DialogResult -eq [System.Windows.Forms.DialogResult]::OK) {
    $ISO_PATH = $FileBrowser.FileName
    Write-Host "ISO seleccionada: $ISO_PATH" -ForegroundColor Green
} 
else {
    Write-Host "Operación cancelada. No se seleccionó ninguna ISO. Saliendo del script..." -ForegroundColor Red
    exit
}

# ==========================================
# PASO 2: Bucle de creación de VMs
# ==========================================
foreach ($NAME in $VM_Names) {
    Write-Host "`n--------------------------------------------------" -ForegroundColor Magenta
    Write-Host "Creando y configurando $NAME..." -ForegroundColor Yellow

    # Crear VM
    & $VBOX createvm --name $NAME --ostype $OS_TYPE --register

    # Rutas dinámicas para la VM actual
    $VM_INFO = & $VBOX showvminfo $NAME --machinereadable | Select-String "CfgFile="
    $VM_CONFIG_PATH = $VM_INFO.ToString().Split('"')[1]
    $VM_DIR = Split-Path -Parent $VM_CONFIG_PATH
    $DISK_PATH = Join-Path $VM_DIR "$NAME.vdi"

    # Hardware y Red
    & $VBOX modifyvm $NAME --memory $RAM --cpus $CPUS --vram 32 --nic1 nat --nic2 intnet --intnet2 "Red_Swarm" --graphicscontroller vmsvga

    # Disco Duro
    Write-Host "Creando disco en: $VM_DIR"
    & $VBOX createmedium disk --filename "$DISK_PATH" --size $DISK_SIZE --format VDI 2>&1
    & $VBOX storagectl $NAME --name "SATA" --add sata --controller IntelAhci --hostiocache on
    & $VBOX storageattach $NAME --storagectl "SATA" --port 0 --device 0 --type hdd --medium "$DISK_PATH" --nonrotational on

    # Lector CD/DVD con la ISO ya montada
    & $VBOX storagectl $NAME --name "IDE" --add ide
    & $VBOX storageattach $NAME --storagectl "IDE" --port 1 --device 0 --type dvddrive --medium "$ISO_PATH"

    Write-Host "$NAME está lista." -ForegroundColor Green
}

# ==========================================
# PASO 3: Menú de arranque de las máquinas recién creadas
# ==========================================
Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "Las 4 máquinas han sido creadas exitosamente." -ForegroundColor Green
Write-Host "¿Qué deseas hacer ahora?" -ForegroundColor Yellow
Write-Host "1. No arrancar ninguna máquina (Salir)."
Write-Host "2. Arrancar SOLO la principal (Test-App_Manager)."
Write-Host "3. Arrancar TODAS (ATENCIÓN: Posible alta carga para el sistema anfitrión)." -ForegroundColor Red

$opcion = Read-Host "Elige una opción (1, 2 o 3)"

switch ($opcion) {
    '2' {
        Write-Host "Iniciando Test-App_Manager..." -ForegroundColor Green
        & $VBOX startvm "Test-App_Manager" --type gui
    }
    '3' {
        Write-Host "Iniciando TODAS las máquinas..." -ForegroundColor Red
        foreach ($NAME in $VM_Names) {
            Write-Host "Iniciando $NAME..." -ForegroundColor Green
            & $VBOX startvm $NAME --type gui
            Start-Sleep -Seconds 4 # Pausa de 4 segundos para no agobiar la CPU del host
        }
    }
    default {
        Write-Host "No se arrancará ninguna máquina. Recuerda realizar la instalación del SO." -ForegroundColor Cyan
    }
}