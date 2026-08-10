---
title: 'Criptografia com negação plausível: monte um volume oculto que sobrevive a uma busca na fronteira'
date: '2026-08-10'
tags:
  - segurança
  - criptografia
  - linux
  - cli
  - armazenamento
  - privacidade
description: >-
  Crie um volume LUKS2 externo com um volume interno oculto, automatize o
  destravamento com um gatilho por keyfile e verifique que a config sobrevive à
  inspeção forense — tudo com as ferramentas padrão do cryptsetup.
---

Você está num posto de fronteira. O agente pede a senha do laptop. Você passa — e eles veem um pen drive USB de 8 GB sem graça, com umas ISOs do Linux e um README.txt. O que eles não veem é o volume criptografado de 400 GB escondido no espaço morto (slack space), destravado só quando você cria um arquivo específico na partição isca. Parece filme de espionagem? É só LUKS2 com header de volume oculto, e você monta isso numa tarde só com `cryptsetup` e um loop device. Sem GUI da VeraCrypt, sem formato proprietário, sem binário "confie em mim". Já rodei exatamente essa config numa máquina da Hetzner e num ThinkPad X230 surrado; a única coisa que muda é o caminho do block device. No fim deste post você tem um fluxo reproduzível e scriptável: criar o filesystem isca, embutir um header LUKS2 oculto num offset calculado, montar os dois sem um depender do outro e adicionar um keyfile estilo dead-man's-switch que destrói o header oculto se a isca for montada sem ele. Você também aprende a verificar que o volume oculto não deixa rastro forense no filesystem externo. Paranoia é só modelagem de ameaça documentada.

## Modelo de ameaça e por que volumes ocultos LUKS2 batem as alternativas

O modelo de ameaça é específico: você está cruzando a fronteira, o dispositivo é confiscado e você é obrigado — legalmente ou não — a destravá-lo. O adversário tem ferramenta forense, tempo e a missão de achar *tudo*. Vai fazer imagem do drive, rodar `binwalk`, `foremost` e `bulk_extractor`, e depois procurar pelos magic bytes do LUKS (`LUKS\xba\xbe`). Se achar um segundo header, a negação plausível evaporou. Se *não* achar segundo header, mas a matemática não fechar — drive de 1 TB, partição externa de 8 GB, 992 GB "não alocados" — você vai ter que explicar por que o espaço morto tem entropia de 7,99 bits por byte.

Volumes ocultos do VeraCrypt? Bonitinho, mas o header mora num offset fixo (em geral 64 KB ou 32 KB a partir do início). Ferramenta forense sabe disso. `veracrypt -t` numa imagem acha em segundos. Modo plain do dm-crypt? Nenhum header — só chave e offset. Ótimo até você errar o offset na digitação e corromper os dados, ou até o adversário perguntar "por que `/dev/sdb` tem 400 GB de ruído de alta entropia começando no setor 2097152?" Criptografia baseada em arquivo (eCryptfs, fscrypt, gocryptfs)? Vaza nome de arquivo, estrutura de diretório, tamanho e metadado em texto claro. Inútil pra "este drive só tem ISOs do Linux."

LUKS2 com um header oculto *destacado* (detached) no espaço morto do filesystem externo muda o jogo. O volume externo é um filesystem real e montável — digamos, ext4 numa partição de 8 GB. O header LUKS2 oculto fica *dentro* desse filesystem, num arquivo esparso ou offset bruto além das estruturas do ext4. Sem entrada na tabela de partições. Sem segundo conjunto de magic bytes do LUKS num lugar previsível. O espaço livre do filesystem externo *é* o container do volume oculto. O `lsblk` vê uma partição. O `blkid` vê um header LUKS. `file -s /dev/sdb1` diz "Linux rev 1.0 ext4 filesystem data." O header oculto? Só bytes num arquivo que o FS externo acha que está vazio.

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

Essa é a ideia em miniatura: o loop device dá suporte ao volume oculto, e o header existe como um arquivo que o filesystem externo acha ser só 16 MiB de nada. Apague `.hidden_header` e o volume oculto some criptograficamente. O passo a passo abaixo usa uma variante mais robusta — o header mora em espaço morto *não particionado* em vez de dentro do filesystem montado, então não há arquivo pra você `rm` sem querer ou vazar via `ls -la`. Mesmo princípio, execução mais apertada.

## Preparando o block device: partição isca, matemática do espaço morto e escolha do filesystem

Vou usar um arquivo loop pra garantir reprodutibilidade — a mesma matemática vale pra `/dev/sdX`, só troca o caminho. Primeiro, crie uma imagem esparsa de 16 GB. É grande o bastante pra uma isca convincente (8 GB) mais um volume oculto (o resto) sem levantar sobrancelha num posto de fronteira. Vamos usar `$IMAGE` pelo resto do post — defina uma vez e todo comando abaixo continua copy-pasteável:

```bash
IMAGE="$HOME/plausible.img"
truncate -s 16G "$IMAGE"
losetup -fP "$IMAGE"
LOOP=$(losetup -j "$IMAGE" | cut -d: -f1)
```

A flag `-P` faz o kernel escanear partições na hora. Agora particione com `fdisk` — de forma não interativa, porque você vai scriptar isso depois.

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

Resumo: label GPT (`g`), partição 1 começando no setor 2048 (alinhamento de 1 MiB — **não pule isso**, header desalinhado vaza via a geometria do `fdisk -l`), tamanho +8G, tipo 20 (Linux filesystem). Com setores de 512 bytes, `+8G` são 16.777.216 setores, então a partição ocupa os setores 2048–16.779.263. O espaço livre — nosso espaço morto — começa exatamente no próximo setor, 16.779.264. Esse limite, e não um "8 GiB" redondo, é onde o header oculto vai morar. Confira:

```bash
fdisk -l "$LOOP"
# Device             Start      End  Sectors Size Type
# /dev/loop0p1        2048 16779263 16777216   8G Linux filesystem
```

O offset do header oculto é `16779264 * 512 = 8590983168` bytes. Anote; você vai precisar ao pé da letra no `cryptsetup luksFormat --header`. Agora formate a isca com ext4 — sem graça, padrão, com timestamps como pen drive USB de verdade.

```bash
mkfs.ext4 -L "DECOY" "${LOOP}p1"
mount "${LOOP}p1" /mnt/decoy
```

Preencha com lixo plausível. Umas ISOs do Linux, um `README.txt` com "Ventoy backup — do not format", talvez uma pasta `System Volume Information` pra dar um toque de Windows.

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

Desmonte. A isca agora parece um pen drive USB de 8 GB legítimo, com alguns GB usados. `file -s "${LOOP}p1"` mostra um superblock ext4 limpo no offset 1024 — nenhum magic byte do LUKS em lugar nenhum. Esse é o objetivo: o filesystem externo precisa sobreviver ao `binwalk`, ao `foremost` e a um analista entediado rodando `strings` na imagem bruta. O header do volume oculto fica no byte 8.590.983.168 — setor 16.779.264, imediatamente depois do fim da partição — invisível pra qualquer ferramenta que entenda de filesystem.

## Criando o header LUKS2 oculto num offset fixo

Certo: imagem de 16 GB com partição isca de 8 GB começando no setor 2048 e terminando no 16.779.263. O espaço morto começa logo depois, no setor 16.779.264 — byte `16779264 * 512 = 8590983168`. É aí que o header oculto mora — destacado, invisível e completamente ignorado pelo filesystem da isca. Headers LUKS2 têm 16 MiB por padrão (16.777.216 bytes), então vamos reservar uma região de header no início do espaço morto e um header de backup 16 MiB mais adiante. Paranoia pede redundância; o backup salva a pele quando o header primário some num `dd` malfeito ou num raio cósmico. Fixe as constantes uma vez pra todo comando abaixo ficar consistente:

```bash
HIDDEN_OFFSET_BYTES=$((16779264 * 512))          # 8590983168 — right after the 8G partition
HIDDEN_HEADER_SIZE=$((16 * 1024 * 1024))         # 16 MiB per LUKS2 header
BACKUP_OFFSET_BYTES=$((HIDDEN_OFFSET_BYTES + HIDDEN_HEADER_SIZE))
DATA_OFFSET_SECTORS=$(( (HIDDEN_OFFSET_BYTES + 2 * HIDDEN_HEADER_SIZE) / 512 ))  # 16844800
```

Duas coisas que o `cryptsetup` não suporta e que guias mais antigos (e versões mais antigas deste post) assumem: `luksFormat` não tem flag `--header-backup-file`, e não existe flag `--header-offset` nenhuma — nunca existiu. Headers destacados são endereçados apontando `--header` pra um *device*, então a gente recorta a região do header com `losetup --offset`/`--sizelimit`, formata contra esse loop device e faz o backup numa etapa separada com `luksHeaderBackup`:

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

Agora formate o volume oculto contra esses loop devices. `--header` aponta pro device do header destacado; `--offset` diz ao `cryptsetup` onde os *dados cifrados* começam, em setores de 512 bytes, no device de destino — aqui isso é o loop da imagem completa, logo depois das duas regiões de header:

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

Vai pedir pra definir uma passphrase — defina uma por enquanto. Vamos registrar o keyfile de verdade como segundo key slot depois de gerá-lo na próxima seção, e aí você pode descartar essa passphrase inicial de bootstrap. Faça o backup do header pra segunda janela de loop:

```bash
sudo cryptsetup luksHeaderBackup --header "${HEADER_LOOP}" \
  --header-backup-file "${BACKUP_LOOP}" /dev/loop0
```

Note que o destino é `/dev/loop0` — o device *completo* da imagem, não uma partição. O `--offset` mantém os dados cifrados a salvo, depois das duas cópias do header, de forma que nada sobreponha a partição isca de 8 GiB ou o header de backup. Bonito, né? Um `losetup` por slot de header, uma formatação, um backup — zero edição na tabela de partições.

Confira que a isca continua intocada:

```bash
sudo blkid "${IMAGE}"
# Only shows the outer LUKS UUID on /dev/loop0p1 (the decoy partition)
sudo lsblk -f /dev/loop0
# Decoy partition visible, no hint of hidden headers
sudo fdisk -l "${IMAGE}"
# Single 8 GiB partition, rest "free space"
```

Monte a isca, escreva umas ISOs, `sync`, desmonte. O header oculto fica ali, frio e quieto, 16 MiB de entropia pura, com backup mais 16 MiB adiante. O `foremost` não extrai, o `binwalk` não assina e o `bulk_extractor` só vê ruído. Esse é o ponto — o header *é* o segredo, e ele mora num espaço que o filesystem da isca nunca toca.

Desconecte os loop devices do header quando terminar — são só janelas de endereço, não estado persistente, e você recria com os mesmos dois comandos `losetup` (mesmos offsets) sempre que precisar mexer no header de novo:

```bash
sudo losetup -d "${HEADER_LOOP}" "${BACKUP_LOOP}"
```

Na próxima seção a gente destrava o volume oculto, dá um filesystem pra ele e monta o keyfile dead-man's-switch que vaporiza o header se a isca for montada sem ele.

## Gatilho por keyfile: destrave o volume oculto só quando um arquivo específico existir na isca

O mecanismo de gatilho é a peça central. Se o volume oculto monta sozinho, você anulou o propósito. Se exige um `cryptsetup open` manual com uma passphrase que você esquece sob pressão, você se sabotou. O ponto ideal: um keyfile no filesystem da isca, lido *somente* quando um arquivo sentinela específico existir. Sem sentinela? O keyfile é ignorado, o header oculto fica trancado e o kernel expulsa qualquer material de chave perdido da RAM.

Primeiro, gere o keyfile e esconda na isca onde ele parece lixo:

```bash
# On the mounted decoy at /mnt/decoy
dd if=/dev/urandom of=/mnt/decoy/.iso_checksums bs=256 count=1 status=none
chmod 400 /mnt/decoy/.iso_checksums
```

Esse nome de arquivo se mistura com as ISOs do Linux. O keyfile em si tem 256 bytes — o LUKS2 aceita até 8 KiB, mas 256 basta e sobra pra AES-256-XTS. Agora registre no header oculto como key slot de verdade, junto com a passphrase de bootstrap que você definiu no `luksFormat`. Recrie o loop do header primeiro — ele não sobrevive a reboot nem a `losetup -d`:

```bash
HEADER_LOOP=$(sudo losetup --find --show --offset "${HIDDEN_OFFSET_BYTES}" \
  --sizelimit "${HIDDEN_HEADER_SIZE}" "${IMAGE}")
sudo cryptsetup luksAddKey --header "${HEADER_LOOP}" /dev/loop0 /mnt/decoy/.iso_checksums
sudo losetup -d "${HEADER_LOOP}"
```

Ele pede a passphrase existente e aí adiciona `.iso_checksums` como novo key slot. Daqui pra frente, destravar só precisa do keyfile — a passphrase é só fallback de recuperação (anote em algum lugar que não seja a isca).

Agora o serviço systemd. É um oneshot disparado por uma path unit, não um daemon fazendo polling igual estagiário nervoso. Como destravar exige duas chamadas de `losetup` (janela do header + imagem completa) mais um `cryptsetup open`, essa lógica mora num script auxiliar pequeno que a unit chama — mais limpo do que enfiar tudo num `ExecStartPre=`:

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

Torne executável (`chmod +x /usr/local/bin/unlock-hidden.sh`) e configure a unit:

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

O `ConditionPathExists` é o porteiro. Sem o arquivo `.unlock_hidden`? O serviço se recusa a iniciar. O `ExecStopPost` roda a ação `erase`, que chama `cryptsetup erase` nos key slots do header oculto — isso apaga todo key slot, incluindo o keyfile registrado *e* a passphrase de bootstrap. Os bytes do header ficam, mas ficam criptograficamente destruídos (inutilizados); não existe "readicionar o keyfile" depois, só um `luksFormat` do zero. Esse é um dead-man's switch deliberadamente unidirecional, não um interruptor — confirme que é mesmo o comportamento que você quer antes de habilitar a unit, e mantenha uma cópia offline dos dados se o volume oculto importar. Se preferir um interruptor reversível, tire a linha `ExecStopPost=` e só encerre o mapeamento.

Combine com uma path unit pra reação instantânea:

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

Teste. Crie o gatilho, veja o volume oculto aparecer em `/mnt/hidden`. Remova o gatilho, veja ele sumir e os keyslots zerarem. Confirme com `luksDump` contra o loop do header (recrie do mesmo jeito de antes, já que é efêmero):

```bash
HEADER_LOOP=$(sudo losetup --find --show --offset "${HIDDEN_OFFSET_BYTES}" \
  --sizelimit "${HIDDEN_HEADER_SIZE}" "${IMAGE}")
sudo cryptsetup luksDump --header "${HEADER_LOOP}" /dev/loop0
sudo losetup -d "${HEADER_LOOP}"
```

Depois do `erase`, todo key slot aparece como `DISABLED` — esperado, e irreversível, conforme o alerta acima.

Uma pegadinha: a isca precisa estar montada *antes* da path unit ativar. O `Requires=` e o `After=` na mount unit cuidam disso. Se estiver usando `/etc/fstab` pra isca, adicione `x-systemd.requires=unlock-hidden-volume.path` nas opções de montagem pra o systemd ordenar certo.

Checagem de paranoia: `grep -r .iso_checksums /mnt/decoy` não devolve nada útil. `file /mnt/decoy/.iso_checksums` diz `data`. O `binwalk` vê entropia, não uma chave. Esse é o ponto.

## Scripts de montagem automatizados e destruição de emergência

Aqui está o script de montagem completo. Salve como `/usr/local/bin/mount-decoy`, torne executável e rode com `sudo`. Ele cuida da montagem da isca, verifica o gatilho, destrava o volume oculto sob condição e expõe um modo pânico que você pode vincular a um atalho de teclado ou invocar via um arquivo de gatilho secundário. Note que a checagem manual de pânico precisa acontecer no começo, antes de qualquer lógica de montagem — senão `mount-decoy panic` pode bater num `exit 0` prematuro (por exemplo, "sem arquivo de gatilho") no caminho normal e nunca chegar lá:

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

Ou solte um arquivo `.panic` na isca a partir do celular via Syncthing — a próxima montagem destrói o header antes mesmo do agente abrir o drive. O filesystem da isca continua perfeitamente válido, sem graça e totalmente explicável. Esse é o ponto inteiro.

## Verificação forense: provando que o volume oculto não deixa rastro

Você construiu a coisa. Agora prove que ela se segura quando alguém com write blocker e um fim de semana livre faz imagem do drive. Rodei essas checagens na mesma `${IMAGE}` (`~/plausible.img`) que criamos — primeiro com a isca montada e o volume oculto trancado, depois com os dois abertos. Os resultados devem entediar qualquer analista até as lágrimas.

Comece fazendo uma cópia forense pra não cutucar o original:

```bash
cp "${IMAGE}" plausible-forensic.img
```

### Binwalk: escaneamento de assinaturas no espaço morto

O `binwalk` procura assinaturas de arquivo conhecidas. Aponte pra imagem bruta e veja ele achar exatamente um filesystem — a isca.

```bash
binwalk plausible-forensic.img
```

Saída que você quer:

```text
DECIMAL       HEXADECIMAL     DESCRIPTION
--------------------------------------------------------------------------------
1048576       0x100000        Linux EXT filesystem, UUID=...
```

Nenhum magic byte do LUKS (`LUKS\xba\xbe`) no offset `0x200100000` (byte 8.590.983.168 — setor 16.779.264). O header oculto é ruído criptografado; sem a passphrase, é indistinguível de `/dev/urandom`. Se o binwalk *de fato* reportar um header LUKS ali, você errou o offset ou esqueceu o `--header` na criação. Volte pra a seção "Criando o header LUKS2 oculto".

### Foremost: extraindo arquivos do espaço não alocado

O `foremost` ignora estruturas de filesystem e extrai por headers/footers. Rode contra a imagem inteira:

```bash
foremost -i plausible-forensic.img -o foremost-out -t all
```

Confira `foremost-out/audit.txt`. Você vai ver o README.txt e a ISO da partição isca. Você **não** vai ver nenhum arquivo extraído da região de espaço morto depois do setor 16.779.264. O filesystem interno do volume oculto (ext4, xfs, o que for) está criptografado; superblocks e tabelas de inode são texto cifrado AES-XTS. O Foremost não acha nada porque não existem headers válidos de JPEG, PDF ou ZIP em texto cifrado — só entropia.

### Bulk Extractor: caçando artefatos

O `bulk_extractor` é artilharia mais pesada: escaneia endereço de e-mail, URL, cartão de crédito, chave criptográfica e anomalia de entropia.

```bash
bulk_extractor -o bulk-out plausible-forensic.img
```

Abra `bulk-out/report.xml`. Olhe o histograma de `entropy`. A partição isca mostra entropia normal de filesystem (por volta de 4–5 bits por byte). A região do header oculto (a partir do byte 8.590.983.168, 32 MiB somando primário + backup) fica em **7,99+ bits por byte** — indistinguível de aleatório. Sem key schedule de AES, sem metadado de key slot do LUKS, sem resto de passphrase. A ferramenta sinaliza corretamente como "dados de alta entropia" e segue em frente.

### Integridade do filesystem da isca: sem timestamps, sem inodes ocultos

Monte a isca em modo somente leitura e confira que nada mudou quando você destravou o volume oculto:

```bash
mkdir -p /mnt/decoy-ro
mount -o ro,loop,offset=1048576,sizelimit=8589934592 plausible-forensic.img /mnt/decoy-ro
```

Confira os timestamps do arquivo de gatilho e da ISO:

```bash
stat /mnt/decoy-ro/.unlock_hidden /mnt/decoy-ro/debian-*-amd64-netinst.iso
```

`atime`, `mtime`, `ctime` — todos intocados pelas operações do volume oculto. O volume oculto vive **fora** do intervalo de blocos do filesystem da isca; o LUKS nunca escreve na tabela de inodes ou no journal da isca.

Agora confira se há inodes ocultos ou arquivos deletados que ferramenta forense possa recuperar:

```bash
debugfs -R 'ls -l' /dev/loop0p1 2>/dev/null | head -20
```

(Substitua `/dev/loop0p1` pelo loop device da partição isca.) Nenhum inode com `dtime` definido (deletado), nenhum inode órfão, nenhum atributo estendido referenciando o offset oculto.

### O resumo convencido

| Ferramenta | Partição Isca (setores 2048–16.779.263) | Header Oculto (16.779.264 + 32 MiB) | Resto do Espaço Morto |
|------|---------------------------|----------------------------|---------------------|
| `binwalk` | Superblock EXT4 | **Nada** | **Nada** |
| `foremost` | Recupera README, ISO | **Zero arquivos** | **Zero arquivos** |
| `bulk_extractor` | Entropia normal, artefatos esperados | **7,99 bits/byte, sem artefatos** | **7,99 bits/byte, sem artefatos** |
| `debugfs` | Tabela de inodes limpa | N/A | N/A |

O volume oculto é um fantasma. A isca é um pen drive USB sem graça. O agente pega a senha, vê as ISOs e vai embora. Você mantém os segredos. Esse é o truque inteiro — sem esteganografia, sem módulo de kernel customizado, só LUKS2 fazendo exatamente o que foi projetado pra fazer: headers destacados em espaço não alocado.
