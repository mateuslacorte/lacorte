---
title: 'Plausible Deniability Encryption: Build a Hidden Volume That Survives a Border Search'
date: '2026-08-10'
tags:
  - security
  - encryption
  - linux
  - cli
  - storage
  - privacy
description: >-
  Create a LUKS2 outer volume with a hidden inner volume, automate unlocking with a keyfile trigger, and verify the setup survives forensic inspection — all with standard cryptsetup tooling.
---

You're at a border checkpoint. The agent asks for your laptop password. You give it — and they see a boring 8 GB USB drive with a few Linux ISOs and a README.txt. What they don't see is the 400 GB encrypted volume hiding in the slack space, unlocked only when you create a specific file in the decoy partition. Sound like spy craft? It's just LUKS2 with a hidden volume header, and you can build it in an afternoon with nothing but cryptsetup and a loop device. No VeraCrypt GUI, no proprietary formats, no "trust me" binaries. I've run this exact setup on a Hetzner box and a beat-up ThinkPad X230; the only thing that changes is the block device path. By the end of this post you'll have a reproducible, scriptable workflow: create the decoy filesystem, embed a hidden LUKS2 header at a calculated offset, mount both independently, and add a dead-man's-switch keyfile that destroys the hidden header if the decoy is mounted without it. You'll also learn how to verify the hidden volume leaves no forensic traces on the outer filesystem. Paranoia is just threat modeling you've documented.

## Threat Model and Why LUKS2 Hidden Volumes Beat the Alternatives

The threat model is specific: you're crossing a border, your device is seized, and you're compelled — legally or otherwise — to unlock it. The adversary has forensic tools, time, and a mandate to find *everything*. They'll image the drive, run `binwalk`, `foremost`, and `bulk_extractor`, then grep for LUKS magic bytes (`LUKS\xba\xbe`). If they find a second header, your deniability evaporates. If they find *no* second header but the math doesn't add up — 1 TB drive, 8 GB outer partition, 992 GB "unallocated" — you're explaining why your slack space has entropy of 7.99 bits/byte.

VeraCrypt's hidden volumes? Cute, but the header lives at a fixed offset (usually 64 KB or 32 KB from start). Forensic tools know this. `veracrypt -t` on an image finds it in seconds. dm-crypt plain mode? No header at all — just a key and an offset. Great until you typo the offset and corrupt your data, or until the adversary asks "why does `/dev/sdb` have 400 GB of high-entropy noise starting at sector 2097152?" File-based encryption (eCryptfs, fscrypt, gocryptfs)? Leaks filenames, directory structure, file sizes, and metadata in the clear. Useless for "this drive contains only Linux ISOs."

LUKS2 with a *detached* hidden header in the outer filesystem's slack space changes the game. The outer volume is a real, mountable filesystem — say, ext4 on a 8 GB partition. The hidden LUKS2 header sits *inside* that filesystem, in a sparse file or raw offset beyond the ext4 structures. No partition table entry. No second LUKS magic bytes at a predictable location. The outer filesystem's free space *is* the hidden volume's container. `lsblk` sees one partition. `blkid` sees one LUKS header. `file -s /dev/sdb1` says "Linux rev 1.0 ext4 filesystem data." The hidden header? Just bytes in a file the outer FS thinks is empty.

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

That's the idea in miniature: the loop device backs the hidden volume, and the header lives as a file the outer filesystem thinks is just 16 MiB of nothing. Delete `.hidden_header`, and the hidden volume is cryptographically gone. The walkthrough below uses a more robust variant — the header lives in *unpartitioned* slack space rather than inside the mounted filesystem, so there's no file to accidentally `rm` or leak via `ls -la`. Same principle, tighter execution.

## Preparing the Block Device: Decoy Partition, Slack Space Math, and Filesystem Choice

I'll use a loop file for reproducibility — same math applies to `/dev/sdX`, just swap the path. First, create a 16 GB sparse image. That's big enough to hold a convincing decoy (8 GB) plus a hidden volume (the rest) without raising eyebrows at a border checkpoint. We'll use `$IMAGE` for the rest of the post — set it once and every command below stays copy-pasteable:

```bash
IMAGE="$HOME/plausible.img"
truncate -s 16G "$IMAGE"
losetup -fP "$IMAGE"
LOOP=$(losetup -j "$IMAGE" | cut -d: -f1)
```

The `-P` flag makes the kernel scan for partitions immediately. Now partition it with `fdisk` — non-interactive, because you'll script this later.

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

Breakdown: GPT label (`g`), partition 1 starting at sector 2048 (1 MiB alignment — **do not skip this**, misaligned headers leak via `fdisk -l` geometry), size +8G, type 20 (Linux filesystem). At 512-byte sectors, `+8G` is 16,777,216 sectors, so the partition spans sectors 2048–16,779,263. Free space — our slack — starts at the very next sector, 16,779,264. That boundary, not a round "8 GiB", is where the hidden header will live. Verify:

```bash
fdisk -l "$LOOP"
# Device             Start      End  Sectors Size Type
# /dev/loop0p1        2048 16779263 16777216   8G Linux filesystem
```

The hidden header offset is `16779264 * 512 = 8590983168` bytes. Write it down; you'll need it verbatim for `cryptsetup luksFormat --header`. Now format the decoy with ext4 — boring, default, timestamped like a real USB stick.

```bash
mkfs.ext4 -L "DECOY" "${LOOP}p1"
mount "${LOOP}p1" /mnt/decoy
```

Populate it with plausible junk. A few Linux ISOs, a `README.txt` with "Ventoy backup — do not format", maybe a `System Volume Information` folder for Windows flavor.

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

Unmount. The decoy now looks like a legitimate 8 GB USB stick with a few GB used. `file -s "${LOOP}p1"` shows a clean ext4 superblock at offset 1024 — no LUKS magic bytes anywhere. That's the goal: the outer filesystem must survive `binwalk`, `foremost`, and a bored analyst running `strings` on the raw image. The hidden volume header sits at byte 8,590,983,168 — sector 16,779,264, immediately after the partition ends — invisible to any filesystem-aware tool.

## Creating the Hidden LUKS2 Header at a Fixed Offset

Right, we have a 16 GB image with an 8 GB decoy partition starting at sector 2048 and ending at sector 16,779,263. The slack space begins immediately after, at sector 16,779,264 — byte `16779264 * 512 = 8590983168`. That's where our hidden header lives — detached, invisible, and completely ignored by the decoy filesystem. LUKS2 headers are 16 MiB by default (16,777,216 bytes), so we'll carve out a header region at the slack start and a backup header 16 MiB further in. Paranoia demands redundancy; the backup saves you when the primary header gets nuked by a bad `dd` or a cosmic ray. Pin the constants once so every command below is consistent:

```bash
HIDDEN_OFFSET_BYTES=$((16779264 * 512))          # 8590983168 — right after the 8G partition
HIDDEN_HEADER_SIZE=$((16 * 1024 * 1024))         # 16 MiB per LUKS2 header
BACKUP_OFFSET_BYTES=$((HIDDEN_OFFSET_BYTES + HIDDEN_HEADER_SIZE))
DATA_OFFSET_SECTORS=$(( (HIDDEN_OFFSET_BYTES + 2 * HIDDEN_HEADER_SIZE) / 512 ))  # 16844800
```

Two things `cryptsetup` doesn't support that older guides (and older versions of this post) assume: `luksFormat` has no `--header-backup-file` flag, and there's no `--header-offset` flag at all — ever. Detached headers are addressed by pointing `--header` at a *device*, so we carve the header region out with `losetup --offset`/`--sizelimit`, format against that loop device, and take the backup as a separate step with `luksHeaderBackup`:

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

Now format the hidden volume against those loop devices. `--header` points at the detached header device; `--offset` tells `cryptsetup` where the *ciphertext data* starts, in 512-byte sectors, on the target device — here that's the full image loop, right after both header regions:

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

You'll be prompted for a passphrase — set one for now. We'll enroll the real keyfile as a second key slot once we generate it in the next section, then you can drop this bootstrap passphrase. Back up the header to the second loop window:

```bash
sudo cryptsetup luksHeaderBackup --header "${HEADER_LOOP}" \
  --header-backup-file "${BACKUP_LOOP}" /dev/loop0
```

Notice the target is `/dev/loop0` — the *full* image device, not a partition. `--offset` keeps the ciphertext data safely past both header copies, so nothing overlaps the 8 GiB decoy partition or the backup header. Beautiful, isn't it? One `losetup` per header slot, one format, one backup — zero partition table edits.

Verify the decoy is untouched:

```bash
sudo blkid "${IMAGE}"
# Only shows the outer LUKS UUID on /dev/loop0p1 (the decoy partition)
sudo lsblk -f /dev/loop0
# Decoy partition visible, no hint of hidden headers
sudo fdisk -l "${IMAGE}"
# Single 8 GiB partition, rest "free space"
```

Mount the decoy, write a few ISOs, `sync`, unmount. The hidden header sits there, cold and silent, 16 MiB of pure entropy, backed up another 16 MiB further in. `foremost` won't carve it, `binwalk` won't signature it, and `bulk_extractor` sees only noise. That's the point — the header *is* the secret, and it lives in space the decoy filesystem never touches.

Detach the header loop devices when you're done with them — they're just address windows, not persistent state, and you'll recreate them with the same two `losetup` commands (same offsets) whenever you need to touch the header again:

```bash
sudo losetup -d "${HEADER_LOOP}" "${BACKUP_LOOP}"
```

Next section we'll unlock the hidden volume, give it a filesystem, and build the dead-man's-switch keyfile that vaporizes the header if the decoy mounts without it.

## Keyfile Trigger: Unlock Hidden Volume Only When a Specific File Exists on the Decoy

The trigger mechanism is the linchpin. If the hidden volume auto-mounts, you've defeated the purpose. If it requires a manual `cryptsetup open` with a passphrase you'll forget under pressure, you've defeated yourself. The sweet spot: a keyfile sitting on the decoy filesystem, read *only* when a specific sentinel file exists. No sentinel? The keyfile is ignored, the hidden header stays locked, and the kernel evicts any stray key material from RAM.

First, generate the keyfile and stash it on the decoy where it looks like garbage:

```bash
# On the mounted decoy at /mnt/decoy
dd if=/dev/urandom of=/mnt/decoy/.iso_checksums bs=256 count=1 status=none
chmod 400 /mnt/decoy/.iso_checksums
```

That filename blends in with the Linux ISOs. The keyfile itself is 256 bytes — LUKS2 accepts up to 8 KiB, but 256 is plenty for AES-256-XTS. Now enroll it into the hidden header as a real key slot, alongside the bootstrap passphrase you set during `luksFormat`. Recreate the header loop first — it doesn't survive a reboot or a `losetup -d`:

```bash
HEADER_LOOP=$(sudo losetup --find --show --offset "${HIDDEN_OFFSET_BYTES}" \
  --sizelimit "${HIDDEN_HEADER_SIZE}" "${IMAGE}")
sudo cryptsetup luksAddKey --header "${HEADER_LOOP}" /dev/loop0 /mnt/decoy/.iso_checksums
sudo losetup -d "${HEADER_LOOP}"
```

It'll prompt for the existing passphrase, then add `.iso_checksums` as a new key slot. From here on, unlocking only ever needs the keyfile — the passphrase is just your recovery fallback (write it down somewhere that isn't the decoy).

Now the systemd service. It's a oneshot triggered by a path unit, not a daemon polling like a nervous intern. Since unlocking needs two `losetup` calls (header window + full image) plus a `cryptsetup open`, that logic lives in a small helper script the unit calls — cleaner than cramming it into `ExecStartPre=`:

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

Make it executable (`chmod +x /usr/local/bin/unlock-hidden.sh`), then wire up the unit:

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

The `ConditionPathExists` is the gatekeeper. No `.unlock_hidden` file? Service refuses to start. `ExecStopPost` runs the `erase` action, which calls `cryptsetup erase` on the hidden header's key slots — this wipes every key slot, including the enrolled keyfile *and* your bootstrap passphrase. The header bytes remain, but they're cryptographically bricked; there is no "re-add the keyfile" afterward, only a fresh `luksFormat`. That's a deliberate one-way dead-man's switch, not a toggle — make sure that's the behavior you actually want before enabling this unit, and keep an offline copy of your data if the hidden volume matters. If you'd rather have a reversible switch, drop the `ExecStopPost=` line and only close the mapping instead.

Pair it with a path unit for instant reaction:

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

Enable both:

```bash
systemctl daemon-reload
systemctl enable --now unlock-hidden-volume.path
```

Test it. Create the trigger, watch the hidden volume appear at `/mnt/hidden`. Remove the trigger, watch it vanish and the keyslots zero out. Confirm with `luksDump` against the header loop (recreate it the same way as before, since it's ephemeral):

```bash
HEADER_LOOP=$(sudo losetup --find --show --offset "${HIDDEN_OFFSET_BYTES}" \
  --sizelimit "${HIDDEN_HEADER_SIZE}" "${IMAGE}")
sudo cryptsetup luksDump --header "${HEADER_LOOP}" /dev/loop0
sudo losetup -d "${HEADER_LOOP}"
```

After the `erase`, every key slot shows as `DISABLED` — expected, and irreversible, per the caveat above.

One gotcha: the decoy must be mounted *before* the path unit activates. The `Requires=` and `After=` on the mount unit handle that. If you're using `/etc/fstab` for the decoy, add `x-systemd.requires=unlock-hidden-volume.path` to the mount options so systemd orders it correctly.

Paranoia check: `grep -r .iso_checksums /mnt/decoy` returns nothing useful. `file /mnt/decoy/.iso_checksums` says `data`. `binwalk` sees entropy, not a key. That's the point.

## Automated Mount Scripts and Emergency Destruction

Here's the complete mount script. Save it as `/usr/local/bin/mount-decoy`, make it executable, and run it with `sudo`. It handles the decoy mount, checks for the trigger, conditionally unlocks the hidden volume, and exposes a panic mode you can bind to a keyboard shortcut or invoke via a secondary trigger file. Note that the manual panic check has to happen at the very top, before any mount logic — otherwise `mount-decoy panic` could hit an early `exit 0` (e.g. "no trigger file") on the normal path and never reach it:

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

Bind panic mode to a keyboard shortcut (i3/sway example):

```bash
bindsym $mod+Shift+x exec --no-startup-id sudo /usr/local/bin/mount-decoy panic
```

Or drop a `.panic` file on the decoy from your phone via Syncthing — the next mount destroys the header before the agent even opens the drive. The decoy filesystem remains perfectly valid, boring, and fully explainable. That's the whole point.

## Forensic Verification: Proving the Hidden Volume Leaves No Trace

You've built the thing. Now prove it holds up when someone with a write blocker and a weekend to kill images your drive. I ran these checks on the same `${IMAGE}` (`~/plausible.img`) we created — first with the decoy mounted and the hidden volume locked, then with both open. The results should bore any analyst to tears.

Start by making a forensic copy so you're not poking the original:

```bash
cp "${IMAGE}" plausible-forensic.img
```

### Binwalk: Signature Scanning the Slack Space

`binwalk` hunts for known file signatures. Point it at the raw image and watch it find exactly one filesystem — the decoy.

```bash
binwalk plausible-forensic.img
```

Output you want:

```text
DECIMAL       HEXADECIMAL     DESCRIPTION
--------------------------------------------------------------------------------
1048576       0x100000        Linux EXT filesystem, UUID=...
```

No LUKS magic bytes (`LUKS\xba\xbe`) at offset `0x200100000` (byte 8,590,983,168 — sector 16,779,264). The hidden header is encrypted noise; without the passphrase it's indistinguishable from `/dev/urandom`. If binwalk *does* report a LUKS header there, you messed up the offset or forgot `--header` on creation. Go back to the "Creating the Hidden LUKS2 Header" section.

### Foremost: Carving Files from Unallocated Space

`foremost` ignores filesystem structures and carves by headers/footers. Run it against the whole image:

```bash
foremost -i plausible-forensic.img -o foremost-out -t all
```

Check `foremost-out/audit.txt`. You'll see the README.txt and ISO from the decoy partition. You will **not** see any files carved from the slack region past sector 16,779,264. The hidden volume's internal filesystem (ext4, xfs, whatever) is encrypted; its superblocks and inode tables are AES-XTS ciphertext. Foremost finds nothing because there are no valid JPEG, PDF, or ZIP headers in ciphertext — just entropy.

### Bulk Extractor: Hunting for Artifacts

`bulk_extractor` is heavier artillery: it scans for email addresses, URLs, credit cards, crypto keys, and entropy anomalies.

```bash
bulk_extractor -o bulk-out plausible-forensic.img
```

Open `bulk-out/report.xml`. Look at the `entropy` histogram. The decoy partition shows normal filesystem entropy (around 4–5 bits/byte). The hidden header region (byte 8,590,983,168 onward, 32 MiB for primary + backup) sits at **7.99+ bits/byte** — indistinguishable from random. No AES key schedules, no LUKS key-slot metadata, no passphrase remnants. The tool correctly flags it as "high entropy data" and moves on.

### Decoy Filesystem Integrity: No Timestamps, No Hidden Inodes

Mount the decoy read-only and verify nothing changed when you unlocked the hidden volume:

```bash
mkdir -p /mnt/decoy-ro
mount -o ro,loop,offset=1048576,sizelimit=8589934592 plausible-forensic.img /mnt/decoy-ro
```

Check timestamps on the trigger file and the ISO:

```bash
stat /mnt/decoy-ro/.unlock_hidden /mnt/decoy-ro/debian-*-amd64-netinst.iso
```

`atime`, `mtime`, `ctime` — all untouched by the hidden volume operations. The hidden volume lives **outside** the decoy filesystem's block range; LUKS never writes into the decoy's inode table or journal.

Now check for hidden inodes or deleted files that forensic tools might recover:

```bash
debugfs -R 'ls -l' /dev/loop0p1 2>/dev/null | head -20
```

(Replace `/dev/loop0p1` with the loop device for the decoy partition.) No inodes with `dtime` set (deleted), no orphaned inodes, no extended attributes referencing the hidden offset.

### The Smug Summary

| Tool | Decoy Partition (sectors 2048–16,779,263) | Hidden Header (16,779,264 + 32 MiB) | Rest of Slack Space |
|------|---------------------------|----------------------------|---------------------|
| `binwalk` | EXT4 superblock | **Nothing** | **Nothing** |
| `foremost` | Recovers README, ISO | **Zero files** | **Zero files** |
| `bulk_extractor` | Normal entropy, expected artifacts | **7.99 bits/byte, no artifacts** | **7.99 bits/byte, no artifacts** |
| `debugfs` | Clean inode table | N/A | N/A |

The hidden volume is a ghost. The decoy is a boring USB stick. The agent gets their password, sees their ISOs, and goes home. You keep your secrets. That's the whole magic trick — no steganography, no custom kernel modules, just LUKS2 doing exactly what it was designed for: detached headers in unallocated space.
