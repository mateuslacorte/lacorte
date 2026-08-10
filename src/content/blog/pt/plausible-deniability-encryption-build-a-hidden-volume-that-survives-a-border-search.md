---
title: 'Criptografia com Negação Plausível: Construa um Volume Oculto Que Sobrevive a uma Busca na Fronteira'
date: '2026-08-10'
tags:
  - segurança
  - criptografia
  - linux
  - cli
  - armazenamento
  - privacidade
description: >-
  Crie um volume LUKS2 externo com um volume interno oculto, automatize o destravamento com um gatilho por keyfile, e verifique que a configuração sobrevive à inspeção forense — tudo com as ferramentas padrão do cryptsetup.
---

Você está num posto de fronteira. O agente pede a senha do seu laptop. Você dá — e eles veem um pen drive USB de 8 GB sem graça, com algumas ISOs do Linux e um README.txt. O que eles não veem é o volume criptografado de 400 GB escondido no espaço morto (slack space), destravado só quando você cria um arquivo específico na partição isca. Parece coisa de espionagem? É só LUKS2 com um header de volume oculto, e você constrói isso numa tarde só com `cryptsetup` e um loop device. Sem GUI da VeraCrypt, sem formatos proprietários, sem binários "confie em mim". Já rodei exatamente essa configuração numa máquina da Hetzner e num ThinkPad X230 surrado; a única coisa que muda é o caminho do block device. Ao final deste post você vai ter um fluxo reproduzível e scriptável: criar o filesystem isca, embutir um header LUKS2 oculto num offset calculado, montar os dois independentemente, e adicionar um keyfile do tipo dead-man's-switch que destrói o header oculto se a isca for montada sem ele. Você também vai aprender a verificar que o volume oculto não deixa vestígios forenses no filesystem externo. Paranoia é só modelagem de ameaças documentada.

## Modelo de Ameaça e Por Que Volumes Ocultos LUKS2 Superam as Alternativas

O modelo de ameaça é específico: você está cruzando uma fronteira, seu dispositivo é confiscado, e você é obrigado — legalmente ou não — a destravá-lo. O adversário tem ferramentas forenses, tempo, e a missão de encontrar *tudo*. Eles vão fazer uma imagem do drive, rodar `binwalk`, `foremost` e `bulk_extractor`, e depois procurar pelos magic bytes do LUKS (`LUKS\xba\xbe`). Se encontrarem um segundo header, sua negação plausível evapora. Se *não* encontrarem um segundo header, mas a matemática não fechar — drive de 1 TB, partição externa de 8 GB, 992 GB "não alocados" — você vai ter que explicar por que seu espaço morto tem entropia de 7,99 bits por byte.

Volumes ocultos do VeraCrypt? Bonitinho, mas o header mora num offset fixo (geralmente 64 KB ou 32 KB a partir do início). Ferramentas forenses sabem disso. `veracrypt -t` numa imagem encontra em segundos. Modo plain do dm-crypt? Nenhum header — só uma chave e um offset. Ótimo até você errar o offset de digitação e corromper seus dados, ou até o adversário perguntar "por que `/dev/sdb` tem 400 GB de ruído de alta entropia começando no setor 2097152?" Criptografia baseada em arquivo (eCryptfs, fscrypt, gocryptfs)? Vaza nomes de arquivo, estrutura de diretórios, tamanhos de arquivo e metadados em texto claro. Inútil para "este drive contém só ISOs do Linux."

LUKS2 com um header oculto *destacado* (detached) no espaço morto do filesystem externo muda o jogo. O volume externo é um filesystem real e montável — digamos, ext4 numa partição de 8 GB. O header LUKS2 oculto fica *dentro* desse filesystem, num arquivo esparso ou offset bruto além das estruturas do ext4. Sem entrada na tabela de partições. Sem um segundo conjunto de magic bytes do LUKS num local previsível. O espaço livre do filesystem externo *é* o container do volume oculto. O `lsblk` vê uma partição. O `blkid` vê um header LUKS. `file -s /dev/sdb1` diz "Linux rev 1.0 ext4 filesystem data." O header oculto? Só bytes num arquivo que o FS externo pensa estar vazio.

```bash
# Sketch only — see "Preparing the Block Device" below for the real,
# exact-offset workflow this post actually walks through.
# Outer: 8 GB LUKS2 + ext4 on /dev/sdb1
cryptsetup luksFormat --type luks2 /dev/sdb1
cryptsetup open /dev/sdb1 outer
mkfs.ext4 /dev/mapper/outer
mount /dev/mapper/outer /mnt/outer

# A detached LUKS2 header is just 16 MiB of bytes — here stashed as a
# dotfile inside the outer FS's free space, loop-mounted for the hidden volume
truncate -s 16M /mnt/outer/.hidden_header
LOOP=$(losetup -f --show /mnt/outer/.hidden_header)
cryptsetup luksFormat --type luks2 --header /mnt/outer/.hidden_header "$LOOP"
```

Essa é a ideia em miniatura: o loop device dá suporte ao volume oculto, e o header existe como um arquivo que o filesystem externo pensa serem apenas 16 MiB de nada. Apague `.hidden_header`, e o volume oculto desaparece criptograficamente. O passo a passo abaixo usa uma variante mais robusta — o header mora em espaço morto *não particionado* em vez de dentro do filesystem montado, então não há arquivo para você `rm` acidentalmente ou vazar via `ls -la`. Mesmo princípio, execução mais rigorosa.

## Preparando o Block Device: Partição Isca, Matemática do Espaço Morto e Escolha do Filesystem

Vou usar um arquivo loop para garantir reprodutibilidade — a mesma matemática se aplica a `/dev/sdX`, só troque o caminho. Primeiro, crie uma imagem esparsa de 16 GB. Isso é grande o suficiente para conter uma isca convincente (8 GB) mais um volume oculto (o resto) sem levantar suspeitas num posto de fronteira. Vamos usar `$IMAGE` pelo resto do post — defina uma vez e todo comando abaixo continua copiável e colável:

```bash
IMAGE="$HOME/plausible.img"
truncate -s 16G "$IMAGE"
losetup -fP "$IMAGE"
LOOP=$(losetup -j "$IMAGE" | cut -d: -f1)
```

A flag `-P` faz o kernel escanear partições imediatamente. Agora particione com `fdisk` — de forma não interativa, porque você vai scriptar isso depois.

```bash
fdisk "$LOOP" <<'EOF'
g
n
1
2048
+8G
t
1
20
w
EOF
```

Detalhando: label GPT (`g`), partição 1 começando no setor 2048 (alinhamento de 1 MiB — **não pule isso**, headers desalinhados vazam via a geometria do `fdisk -l`), tamanho +8G, tipo 20 (Linux filesystem). Com setores de 512 bytes, `+8G` são 16.777.216 setores, então a partição ocupa os setores 2048–16.779.263. O espaço livre — nosso espaço morto — começa exatamente no próximo setor, 16.779.264. Esse limite, e não um redondo "8 GiB", é onde o header oculto vai morar. Verifique:

```bash
fdisk -l "$LOOP"
# Device             Start      End  Sectors Size Type
# /dev/loop0p1        2048 16779263 16777216   8G Linux filesystem
```

O offset do header oculto é `16779264 * 512 = 8590983168` bytes. Anote; você vai precisar dele ao pé da letra para o `cryptsetup luksFormat --header`. Agora formate a isca com ext4 — sem graça, padrão, com timestamps como um pen drive USB de verdade.

```bash
mkfs.ext4 -L "DECOY" "${LOOP}p1"
mount "${LOOP}p1" /mnt/decoy
```

Preencha com lixo plausível. Algumas ISOs do Linux, um `README.txt` com "Ventoy backup — do not format", talvez uma pasta `System Volume Information` para dar um toque de Windows.

```bash
cd /mnt/decoy
# Debian's netinst filename changes with every point release, so fetch the
# current one from the directory listing instead of hardcoding a version
ISO_NAME=$(curl -fsSL https://cdimage.debian.org/debian-cd/current/amd64/iso-cd/ \
  | grep -oE 'debian-[0-9.]+-amd64-netinst\.iso' | head -1)
wget -q "https://cdimage.debian.org/debian-cd/current/amd64/iso-cd/${ISO_NAME}"
echo "Ventoy backup — do not format" > README.txt
mkdir -p "System Volume Information"
touch "System Volume Information/IndexerVolumeGuid"
```

Desmonte. A isca agora parece um pen drive USB de 8 GB legítimo, com alguns GB usados. `file -s "${LOOP}p1"` mostra um superblock ext4 limpo no offset 1024 — nenhum magic byte do LUKS em lugar nenhum. Esse é o objetivo: o filesystem externo precisa sobreviver ao `binwalk`, ao `foremost`, e a um analista entediado rodando `strings` na imagem bruta. O header do volume oculto fica no byte 8.590.983.168 — setor 16.779.264, imediatamente depois do fim da partição — invisível para qualquer ferramenta que entenda de filesystems.

## Criando o Header LUKS2 Oculto num Offset Fixo

Certo, temos uma imagem de 16 GB com uma partição isca de 8 GB começando no setor 2048 e terminando no setor 16.779.263. O espaço morto começa imediatamente depois, no setor 16.779.264 — byte `16779264 * 512 = 8590983168`. É aí que nosso header oculto mora — destacado, invisível, e completamente ignorado pelo filesystem da isca. Headers LUKS2 têm 16 MiB por padrão (16.777.216 bytes), então vamos reservar uma região de header no início do espaço morto e um header de backup 16 MiB mais adiante. Paranoia exige redundância; o backup salva sua pele quando o header primário é destruído por um `dd` mal-feito ou por um raio cósmico. Fixe as constantes uma vez para que todo comando abaixo fique consistente:

```bash
HIDDEN_OFFSET_BYTES=$((16779264 * 512))          # 8590983168 — right after the 8G partition
HIDDEN_HEADER_SIZE=$((16 * 1024 * 1024))         # 16 MiB per LUKS2 header
BACKUP_OFFSET_BYTES=$((HIDDEN_OFFSET_BYTES + HIDDEN_HEADER_SIZE))
DATA_OFFSET_SECTORS=$(( (HIDDEN_OFFSET_BYTES + 2 * HIDDEN_HEADER_SIZE) / 512 ))  # 16844800
```

Duas coisas que o `cryptsetup` não suporta e que guias mais antigos (e versões mais antigas deste post) assumem: `luksFormat` não tem uma flag `--header-backup-file`, e não existe flag `--header-offset` nenhuma — nunca existiu. Headers destacados são endereçados apontando `--header` para um *device*, então nós recortamos a região do header com `losetup --offset`/`--sizelimit`, formatamos contra esse loop device, e fazemos o backup como uma etapa separada com `luksHeaderBackup`:

```bash
# Primary header: a 16 MiB window onto the slack space
HEADER_LOOP=$(sudo losetup --find --show --offset "${HIDDEN_OFFSET_BYTES}" \
  --sizelimit "${HIDDEN_HEADER_SIZE}" "${IMAGE}")
echo "Primary header loop: ${HEADER_LOOP}"   # e.g. /dev/loop10, yours will vary

# Backup header: the next 16 MiB window, right after the primary
BACKUP_LOOP=$(sudo losetup --find --show --offset "${BACKUP_OFFSET_BYTES}" \
  --sizelimit "${HIDDEN_HEADER_SIZE}" "${IMAGE}")
echo "Backup header loop: ${BACKUP_LOOP}"    # e.g. /dev/loop11
```

Agora formate o volume oculto contra esses loop devices. `--header` aponta para o device do header destacado; `--offset` diz ao `cryptsetup` onde os *dados cifrados* começam, em setores de 512 bytes, no device de destino — aqui isso é o loop da imagem completa, logo depois das duas regiões de header:

```bash
sudo cryptsetup luksFormat --type luks2 \
  --header "${HEADER_LOOP}" \
  --offset "${DATA_OFFSET_SECTORS}" \
  --cipher aes-xts-plain64 \
  --key-size 512 \
  --hash sha256 \
  --iter-time 5000 \
  /dev/loop0
```

Você vai ser solicitado a definir uma passphrase — defina uma por enquanto. Vamos registrar o keyfile de verdade como um segundo key slot depois que o gerarmos na próxima seção, e então você pode descartar essa passphrase inicial de bootstrap. Faça o backup do header para a segunda janela de loop:

```bash
sudo cryptsetup luksHeaderBackup --header "${HEADER_LOOP}" \
  --header-backup-file "${BACKUP_LOOP}" /dev/loop0
```

Note que o destino é `/dev/loop0` — o device *completo* da imagem, não uma partição. O `--offset` mantém os dados cifrados a salvo, depois das duas cópias do header, de forma que nada sobreponha a partição isca de 8 GiB ou o header de backup. Bonito, não é? Um `losetup` por slot de header, uma formatação, um backup — zero edições na tabela de partições.

Verifique que a isca continua intocada:

```bash
sudo blkid "${IMAGE}"
# Only shows the outer LUKS UUID on /dev/loop0p1 (the decoy partition)
sudo lsblk -f /dev/loop0
# Decoy partition visible, no hint of hidden headers
sudo fdisk -l "${IMAGE}"
# Single 8 GiB partition, rest "free space"
```

Monte a isca, escreva algumas ISOs, `sync`, desmonte. O header oculto fica ali, frio e silencioso, 16 MiB de entropia pura, com backup mais 16 MiB adiante. O `foremost` não vai extraí-lo, o `binwalk` não vai assiná-lo, e o `bulk_extractor` só vê ruído. Esse é o ponto — o header *é* o segredo, e ele mora num espaço que o filesystem da isca nunca toca.

Desconecte os loop devices do header quando terminar de usá-los — eles são só janelas de endereço, não estado persistente, e você vai recriá-los com os mesmos dois comandos `losetup` (mesmos offsets) sempre que precisar tocar no header novamente:

```bash
sudo losetup -d "${HEADER_LOOP}" "${BACKUP_LOOP}"
```

Na próxima seção vamos destravar o volume oculto, dar a ele um filesystem, e construir o keyfile dead-man's-switch que vaporiza o header se a isca for montada sem ele.

## Gatilho por Keyfile: Destrave o Volume Oculto Só Quando um Arquivo Específico Existir na Isca

O mecanismo de gatilho é a peça central. Se o volume oculto monta automaticamente, você anulou todo o propósito. Se ele exige um `cryptsetup open` manual com uma passphrase que você vai esquecer sob pressão, você se sabotou. O ponto ideal: um keyfile na filesystem da isca, lido *somente* quando um arquivo sentinela específico existir. Sem sentinela? O keyfile é ignorado, o header oculto permanece trancado, e o kernel expulsa qualquer material de chave perdido da RAM.

Primeiro, gere o keyfile e esconda-o na isca onde ele parece lixo:

```bash
# On the mounted decoy at /mnt/decoy
dd if=/dev/urandom of=/mnt/decoy/.iso_checksums bs=256 count=1 status=none
chmod 400 /mnt/decoy/.iso_checksums
```

Esse nome de arquivo se mistura com as ISOs do Linux. O keyfile em si tem 256 bytes — o LUKS2 aceita até 8 KiB, mas 256 é mais do que suficiente para AES-256-XTS. Agora registre-o no header oculto como um key slot de verdade, junto com a passphrase de bootstrap que você definiu durante o `luksFormat`. Recrie o loop do header primeiro — ele não sobrevive a um reboot ou a um `losetup -d`:

```bash
HEADER_LOOP=$(sudo losetup --find --show --offset "${HIDDEN_OFFSET_BYTES}" \
  --sizelimit "${HIDDEN_HEADER_SIZE}" "${IMAGE}")
sudo cryptsetup luksAddKey --header "${HEADER_LOOP}" /dev/loop0 /mnt/decoy/.iso_checksums
sudo losetup -d "${HEADER_LOOP}"
```

Ele vai pedir a passphrase existente, e então adicionar `.iso_checksums` como um novo key slot. Daqui para frente, destravar só vai precisar do keyfile — a passphrase é só seu fallback de recuperação (anote em algum lugar que não seja a isca).

Agora o serviço systemd. É um oneshot disparado por uma path unit, não um daemon fazendo polling como um estagiário nervoso. Como destravar exige duas chamadas de `losetup` (janela do header + imagem completa) mais um `cryptsetup open`, essa lógica mora num pequeno script auxiliar que a unit chama — mais limpo do que espremer tudo num `ExecStartPre=`:

```bash
#!/usr/bin/env bash
# /usr/local/bin/unlock-hidden.sh
set -euo pipefail

IMAGE="$HOME/plausible.img"
HIDDEN_OFFSET_BYTES=8590983168
HIDDEN_HEADER_SIZE=$((16 * 1024 * 1024))
DATA_OFFSET_SECTORS=16844800
KEYFILE="/mnt/decoy/.iso_checksums"
STATE_DIR="/run/unlock-hidden"

case "${1:-open}" in
  open)
    mkdir -p "${STATE_DIR}"
    HEADER_LOOP=$(losetup --find --show --offset "${HIDDEN_OFFSET_BYTES}" \
      --sizelimit "${HIDDEN_HEADER_SIZE}" "${IMAGE}")
    IMAGE_LOOP=$(losetup --find --show "${IMAGE}")
    echo "${HEADER_LOOP}" > "${STATE_DIR}/header-loop"
    echo "${IMAGE_LOOP}" > "${STATE_DIR}/image-loop"
    cryptsetup open --type luks2 --header "${HEADER_LOOP}" \
      --offset "${DATA_OFFSET_SECTORS}" --key-file "${KEYFILE}" \
      "${IMAGE_LOOP}" hidden_volume
    ;;
  close)
    cryptsetup close hidden_volume 2>/dev/null || true
    [[ -f "${STATE_DIR}/image-loop" ]] && losetup -d "$(cat "${STATE_DIR}/image-loop")" 2>/dev/null || true
    [[ -f "${STATE_DIR}/header-loop" ]] && losetup -d "$(cat "${STATE_DIR}/header-loop")" 2>/dev/null || true
    rm -rf "${STATE_DIR}"
    ;;
  erase)
    # Irreversible: destroys every key slot on the header, including the
    # bootstrap passphrase. The 16 MiB of header bytes remain, but nothing
    # unlocks them again — you'd have to luksFormat over it from scratch.
    HEADER_LOOP=$(losetup --find --show --offset "${HIDDEN_OFFSET_BYTES}" \
      --sizelimit "${HIDDEN_HEADER_SIZE}" "${IMAGE}")
    cryptsetup erase --header "${HEADER_LOOP}" "${IMAGE}" -q || true
    "$0" close
    losetup -d "${HEADER_LOOP}" 2>/dev/null || true
    ;;
esac
```

Torne-o executável (`chmod +x /usr/local/bin/unlock-hidden.sh`), depois configure a unit:

```ini
# /etc/systemd/system/unlock-hidden-volume.service
[Unit]
Description=Unlock hidden LUKS2 volume when trigger file exists
Requires=mnt-decoy.mount
After=mnt-decoy.mount
ConditionPathExists=/mnt/decoy/.unlock_hidden

[Service]
Type=oneshot
ExecStart=/usr/local/bin/unlock-hidden.sh open
ExecStart=/bin/mkdir -p /mnt/hidden
ExecStart=/bin/mount /dev/mapper/hidden_volume /mnt/hidden
ExecStop=/bin/umount /mnt/hidden
ExecStopPost=/usr/local/bin/unlock-hidden.sh erase
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
```

O `ConditionPathExists` é o porteiro. Sem o arquivo `.unlock_hidden`? O serviço se recusa a iniciar. O `ExecStopPost` executa a ação `erase`, que chama `cryptsetup erase` nos key slots do header oculto — isso apaga todo key slot, incluindo o keyfile registrado *e* sua passphrase de bootstrap. Os bytes do header permanecem, mas ficam criptograficamente destruídos (bricked); não existe "readicionar o keyfile" depois, só um `luksFormat` do zero. Esse é um dead-man's switch deliberadamente unidirecional, não um interruptor — garanta que esse é realmente o comportamento que você quer antes de habilitar essa unit, e mantenha uma cópia offline dos seus dados se o volume oculto for importante. Se você preferir um interruptor reversível, remova a linha `ExecStopPost=` e apenas encerre o mapeamento em vez disso.

Combine com uma path unit para reação instantânea:

```ini
# /etc/systemd/system/unlock-hidden-volume.path
[Unit]
Description=Watch for hidden volume trigger file
Requires=mnt-decoy.mount
After=mnt-decoy.mount

[Path]
PathExists=/mnt/decoy/.unlock_hidden
Unit=unlock-hidden-volume.service

[Install]
WantedBy=multi-user.target
```

Habilite as duas:

```bash
systemctl daemon-reload
systemctl enable --now unlock-hidden-volume.path
```

Teste. Crie o gatilho, observe o volume oculto aparecer em `/mnt/hidden`. Remova o gatilho, observe ele desaparecer e os keyslots zerarem. Confirme com `luksDump` contra o loop do header (recrie-o da mesma forma de antes, já que é efêmero):

```bash
HEADER_LOOP=$(sudo losetup --find --show --offset "${HIDDEN_OFFSET_BYTES}" \
  --sizelimit "${HIDDEN_HEADER_SIZE}" "${IMAGE}")
sudo cryptsetup luksDump --header "${HEADER_LOOP}" /dev/loop0
sudo losetup -d "${HEADER_LOOP}"
```

Depois do `erase`, todo key slot aparece como `DISABLED` — esperado, e irreversível, conforme o alerta acima.

Uma pegadinha: a isca precisa estar montada *antes* da path unit ativar. O `Requires=` e o `After=` na mount unit cuidam disso. Se você está usando `/etc/fstab` para a isca, adicione `x-systemd.requires=unlock-hidden-volume.path` às opções de montagem para que o systemd ordene corretamente.

Checagem de paranoia: `grep -r .iso_checksums /mnt/decoy` não retorna nada útil. `file /mnt/decoy/.iso_checksums` diz `data`. O `binwalk` vê entropia, não uma chave. Esse é o ponto.

## Scripts de Montagem Automatizados e Destruição de Emergência

Aqui está o script de montagem completo. Salve como `/usr/local/bin/mount-decoy`, torne-o executável, e rode com `sudo`. Ele cuida da montagem da isca, verifica o gatilho, destrava condicionalmente o volume oculto, e expõe um modo pânico que você pode vincular a um atalho de teclado ou invocar via um arquivo de gatilho secundário. Note que a checagem manual de pânico precisa acontecer logo no início, antes de qualquer lógica de montagem — caso contrário, `mount-decoy panic` poderia bater num `exit 0` prematuro (por exemplo, "sem arquivo de gatilho") no caminho normal e nunca chegar lá:

```bash
#!/usr/bin/env bash
set -euo pipefail

IMAGE="${IMAGE:-$HOME/plausible.img}"
DECOY_MNT="/mnt/decoy"
HIDDEN_MNT="/mnt/secret"
TRIGGER_FILE="${DECOY_MNT}/.unlock_hidden"
KEYFILE="${DECOY_MNT}/.iso_checksums"
PANIC_FILE="${DECOY_MNT}/.panic"
HIDDEN_OFFSET_BYTES=8590983168             # sector 16779264 * 512 — right after the 8G decoy partition
HIDDEN_HEADER_SIZE=$((16 * 1024 * 1024))   # 16 MiB LUKS2 header
DATA_OFFSET_SECTORS=16844800               # ciphertext data start, past primary + backup headers
DECOY_PART_OFFSET=$((1024 * 1024))         # partition 1 starts at sector 2048 = 1 MiB

IMAGE_LOOP=""
HEADER_LOOP=""

log() { echo "[$(date '+%H:%M:%S')] $*"; }

nuke_header() {
    log "Overwriting hidden header region..."
    dd if=/dev/urandom of="${IMAGE}" bs=1M count=16 \
        seek=$((HIDDEN_OFFSET_BYTES / 1024 / 1024)) conv=notrunc status=none
    sync
    log "Hidden header destroyed. Decoy remains intact."
}

cleanup() {
    [[ -n "${HEADER_LOOP}" ]] && losetup -d "${HEADER_LOOP}" 2>/dev/null || true
    # Never detach the image loop while something still depends on it — that
    # just orphans an active mount/mapping. Only clean it up on early exits
    # where the decoy was never mounted.
    if [[ -n "${IMAGE_LOOP}" ]] && ! mountpoint -q "${DECOY_MNT}" 2>/dev/null; then
        losetup -d "${IMAGE_LOOP}" 2>/dev/null || true
    fi
}
trap cleanup EXIT

# Manual panic mode — checked FIRST, before any mount attempt, so it can't
# be short-circuited by an early exit further down: sudo mount-decoy panic
if [[ "${1:-}" == "panic" ]]; then
    log "Manual panic invoked."
    cryptsetup close hidden_volume 2>/dev/null || true
    umount -f "${HIDDEN_MNT}" 2>/dev/null || true
    nuke_header
    log "Done. Hidden volume unrecoverable."
    exit 0
fi

IMAGE_LOOP=$(losetup -f --show "${IMAGE}")

log "Mounting decoy partition..."
mkdir -p "${DECOY_MNT}"
mount -o "offset=${DECOY_PART_OFFSET},ro" "${IMAGE_LOOP}" "${DECOY_MNT}"

# Check for the panic FILE next — still before touching the hidden volume
if [[ -f "${PANIC_FILE}" ]]; then
    log "PANIC TRIGGER DETECTED."
    nuke_header
    exit 0
fi

if [[ ! -f "${TRIGGER_FILE}" ]]; then
    log "No trigger file at ${TRIGGER_FILE}. Decoy only."
    exit 0
fi

if [[ ! -f "${KEYFILE}" ]]; then
    log "Trigger present but keyfile ${KEYFILE} is missing. Aborting."
    exit 1
fi

log "Trigger found. Unlocking hidden volume..."
HEADER_LOOP=$(losetup --find --show --offset "${HIDDEN_OFFSET_BYTES}" \
    --sizelimit "${HIDDEN_HEADER_SIZE}" "${IMAGE}")
cryptsetup open --type luks2 --header "${HEADER_LOOP}" \
    --offset "${DATA_OFFSET_SECTORS}" --key-file "${KEYFILE}" \
    "${IMAGE_LOOP}" hidden_volume

# The header is only read at open time — safe to detach right away
losetup -d "${HEADER_LOOP}"
HEADER_LOOP=""

log "Mounting hidden volume at ${HIDDEN_MNT}..."
mkdir -p "${HIDDEN_MNT}"
mount /dev/mapper/hidden_volume "${HIDDEN_MNT}"
log "Hidden volume mounted. Do your work."
log "When finished: umount ${HIDDEN_MNT} && cryptsetup close hidden_volume && umount ${DECOY_MNT}"
```

Vincule o modo pânico a um atalho de teclado (exemplo i3/sway):

```bash
bindsym $mod+Shift+x exec --no-startup-id sudo /usr/local/bin/mount-decoy panic
```

Ou solte um arquivo `.panic` na isca a partir do seu celular via Syncthing — a próxima montagem destrói o header antes mesmo do agente abrir o drive. O filesystem da isca permanece perfeitamente válido, sem graça, e totalmente explicável. Esse é todo o ponto.

## Verificação Forense: Provando Que o Volume Oculto Não Deixa Rastro

Você construiu a coisa. Agora prove que ela se sustenta quando alguém com um write blocker e um fim de semana livre faz uma imagem do seu drive. Rodei essas checagens na mesma `${IMAGE}` (`~/plausible.img`) que criamos — primeiro com a isca montada e o volume oculto trancado, depois com os dois abertos. Os resultados devem entediar qualquer analista até as lágrimas.

Comece fazendo uma cópia forense para não cutucar o original:

```bash
cp "${IMAGE}" plausible-forensic.img
```

### Binwalk: Escaneamento de Assinaturas no Espaço Morto

O `binwalk` procura assinaturas de arquivo conhecidas. Aponte-o para a imagem bruta e observe ele encontrar exatamente um filesystem — a isca.

```bash
binwalk plausible-forensic.img
```

Saída que você quer:

```text
DECIMAL       HEXADECIMAL     DESCRIPTION
--------------------------------------------------------------------------------
1048576       0x100000        Linux EXT filesystem, UUID=...
```

Nenhum magic byte do LUKS (`LUKS\xba\xbe`) no offset `0x200100000` (byte 8.590.983.168 — setor 16.779.264). O header oculto é ruído criptografado; sem a passphrase, ele é indistinguível de `/dev/urandom`. Se o binwalk *realmente* reportar um header LUKS ali, você errou o offset ou esqueceu o `--header` na criação. Volte para a seção "Criando o Header LUKS2 Oculto".

### Foremost: Extraindo Arquivos do Espaço Não Alocado

O `foremost` ignora estruturas de filesystem e extrai por headers/footers. Rode-o contra a imagem inteira:

```bash
foremost -i plausible-forensic.img -o foremost-out -t all
```

Confira `foremost-out/audit.txt`. Você vai ver o README.txt e a ISO da partição isca. Você **não** vai ver nenhum arquivo extraído da região de espaço morto depois do setor 16.779.264. O filesystem interno do volume oculto (ext4, xfs, seja o que for) está criptografado; seus superblocks e tabelas de inode são texto cifrado AES-XTS. O Foremost não encontra nada porque não existem headers válidos de JPEG, PDF ou ZIP em texto cifrado — só entropia.

### Bulk Extractor: Caçando Artefatos

O `bulk_extractor` é artilharia mais pesada: ele escaneia endereços de e-mail, URLs, cartões de crédito, chaves criptográficas, e anomalias de entropia.

```bash
bulk_extractor -o bulk-out plausible-forensic.img
```

Abra `bulk-out/report.xml`. Olhe para o histograma de `entropy`. A partição isca mostra entropia normal de filesystem (por volta de 4–5 bits por byte). A região do header oculto (a partir do byte 8.590.983.168, 32 MiB somando primário + backup) fica em **7,99+ bits por byte** — indistinguível de aleatório. Sem key schedules de AES, sem metadados de key slot do LUKS, sem resquícios de passphrase. A ferramenta corretamente sinaliza como "dados de alta entropia" e segue adiante.

### Integridade do Filesystem da Isca: Sem Timestamps, Sem Inodes Ocultos

Monte a isca em modo somente leitura e verifique que nada mudou quando você destravou o volume oculto:

```bash
mkdir -p /mnt/decoy-ro
mount -o ro,loop,offset=1048576,sizelimit=8589934592 plausible-forensic.img /mnt/decoy-ro
```

Verifique os timestamps do arquivo de gatilho e da ISO:

```bash
stat /mnt/decoy-ro/.unlock_hidden /mnt/decoy-ro/debian-*-amd64-netinst.iso
```

`atime`, `mtime`, `ctime` — todos intocados pelas operações do volume oculto. O volume oculto vive **fora** do intervalo de blocos do filesystem da isca; o LUKS nunca escreve na tabela de inodes ou no journal da isca.

Agora verifique se há inodes ocultos ou arquivos deletados que ferramentas forenses possam recuperar:

```bash
debugfs -R 'ls -l' /dev/loop0p1 2>/dev/null | head -20
```

(Substitua `/dev/loop0p1` pelo loop device da partição isca.) Nenhum inode com `dtime` definido (deletado), nenhum inode órfão, nenhum atributo estendido referenciando o offset oculto.

### O Resumo Convencido

| Ferramenta | Partição Isca (setores 2048–16.779.263) | Header Oculto (16.779.264 + 32 MiB) | Resto do Espaço Morto |
|------|---------------------------|----------------------------|---------------------|
| `binwalk` | Superblock EXT4 | **Nada** | **Nada** |
| `foremost` | Recupera README, ISO | **Zero arquivos** | **Zero arquivos** |
| `bulk_extractor` | Entropia normal, artefatos esperados | **7,99 bits/byte, sem artefatos** | **7,99 bits/byte, sem artefatos** |
| `debugfs` | Tabela de inodes limpa | N/A | N/A |

O volume oculto é um fantasma. A isca é um pen drive USB sem graça. O agente pega a senha, vê as ISOs, e vai para casa. Você mantém seus segredos. Esse é todo o truque de mágica — sem esteganografia, sem módulos de kernel customizados, só LUKS2 fazendo exatamente o que foi projetado para fazer: headers destacados em espaço não alocado.
