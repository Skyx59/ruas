# Deployment RUAS pada STB Armbian

Untuk RUAS yang sudah melayani domain publik, gunakan bagian [upgrade STB existing](#upgrade-stb-existing-ke-authentication). Bagian instalasi awal mencatat prosedur rilis `0.1.0` dari branch `feat/backend-deployment`.

Runbook ini ditujukan untuk operator yang memiliki akses STB dan izin melakukan cutover. Targetnya ZTE B860H dengan RAM sekitar 1,9 GiB, storage internal sekitar 5,7 GB, dan USB di `/mnt/usb-server`. Versi Docker Engine 29.6.0 dan Compose v5.1.4 berasal dari konfigurasi server yang dilaporkan. Periksa keduanya langsung sebelum deployment.

Cloudflare Tunnel yang berjalan di systemd tetap meneruskan `https://antislop.stei.fun/api/*` ke `http://localhost:80`. Gateway RUAS akan menggantikan listener port 80 milik `antislop-gateway-test` setelah lolos staging. aaPanel pada port 1122, CasaOS pada 8081, MySQL, dan phpMyAdmin berada di luar stack RUAS.

## 1. Siapkan checkout khusus

Jalankan di komputer pengembangan dari root repo. Git bundle dapat membawa commit branch ke STB melalui SSH tanpa memerlukan push. Ganti `USER@HOST_STB` dengan akses operator.

```sh
git bundle create /tmp/ruas-backend-deployment.bundle feat/backend-deployment
scp /tmp/ruas-backend-deployment.bundle USER@HOST_STB:/tmp/
```

Jalankan pada STB melalui sesi SSH yang sudah diotorisasi. Gunakan direktori baru. Jika branch sudah tersedia pada remote, checkout baru juga dapat dibuat dari remote.

```sh
git clone --branch feat/backend-deployment /tmp/ruas-backend-deployment.bundle "$HOME/ruas-backend-deployment"
cd "$HOME/ruas-backend-deployment/backend"
git log -1 --oneline
```

Konfirmasi commit yang tampil adalah commit release yang disetujui kelompok.

## 2. Periksa kondisi server

```sh
uname -m
getconf LONG_BIT
docker version --format '{{.Server.Version}}'
docker compose version
docker info --format '{{.OSType}}/{{.Architecture}} cgroup={{.CgroupVersion}} data={{.DockerRootDir}}'
free -h
df -h "$(docker info --format '{{.DockerRootDir}}')" /mnt/usb-server
systemctl is-active cloudflared
docker compose ls -a
docker ps --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}'
sudo ss -ltnp '( sport = :80 or sport = :18080 )'
docker inspect --format 'image={{.Config.Image}} running={{.State.Running}} restart={{.HostConfig.RestartPolicy.Name}} mounts={{range .Mounts}}{{.Destination}} {{end}}' antislop-gateway-test
docker port antislop-gateway-test
```

Lanjutkan setelah `uname -m` menunjukkan `aarch64` atau `arm64`, userspace 64 bit, dan Docker Engine melaporkan Linux ARM64. Untuk ARM 32 bit, hentikan prosedur sampai image dan dependency binary tersedia dan teruji untuk arsitektur itu. Periksa juga ketersediaan disk, port staging 18080, dan dukungan pembatas CPU/memori. Pastikan stack `ruas-backend` belum dipakai layanan lain, Cloudflared aktif, dan port 80 memang digunakan `antislop-gateway-test`.

Rekam respons gateway lama dari `http://localhost:80/api/health` serta dari `https://antislop.stei.fun/api/health` dengan `curl -sS -i --max-time 10`. Catat status dan body yang menjadi acuan rollback, termasuk perkiraan dampak jeda singkat pada saat pergantian port. Bila endpoint health lama tidak tersedia, pilih path `/api/*` yang sudah diketahui berfungsi.

## 3. Staging pada port loopback 18080

Seluruh perintah Compose berikut dijalankan dari direktori `backend/` di checkout baru. Gunakan nama proyek yang sama selama staging, cutover, dan rollback agar core service memakai volume yang sama.

```sh
RUAS_GATEWAY_PORT=18080 docker compose -p ruas-backend config --quiet
docker compose -p ruas-backend build core-service
docker compose -p ruas-backend pull gateway
RUAS_GATEWAY_PORT=18080 docker compose -p ruas-backend up -d --no-build --pull never --wait --wait-timeout 90
docker compose -p ruas-backend ps
docker compose -p ruas-backend exec -T gateway nginx -t
curl -fsS --max-time 5 -H 'Host: antislop.stei.fun' http://127.0.0.1:18080/api/health
curl -fsS --max-time 5 'http://127.0.0.1:18080/api/road-reports?limit=1'
```

Kedua container harus berstatus `healthy`, health harus mengembalikan `{"status":"ok"}`, dan GET daftar harus mengembalikan objek berisi `items`. Periksa bahwa gateway lama tetap berjalan dan jalur publik masih memberikan respons yang sudah dicatat. Status container dan log dapat diperiksa dengan `docker compose -p ruas-backend logs --tail=60 core-service gateway`.

| Layanan | CPU maksimum | RAM maksimum | Penyimpanan dan jaringan |
| --- | --- | --- | --- |
| Core service | 0,50 core | 256 MiB | Port 8000 hanya pada network internal, volume `ruas-backend_core-data` |
| Gateway | 0,25 core | 64 MiB | Port 80 container dipublikasikan hanya ke loopback host |

Pembatas memakai `cpus` dan `mem_limit` pada definisi service. [Spesifikasi layanan Docker Compose](https://docs.docker.com/reference/compose-file/services/).

SQLite tersimpan sebagai `/app/data/ruas.sqlite3` dalam volume. Secara default Docker menempatkan volume pada data root-nya. Cek ruang kosong di lokasi itu sebelum build dan pantau sesudahnya. Untuk penyimpanan pada USB, sepakati dan verifikasi filesystem, mount persisten, serta izin tulis UID/GID `10001:10001` sebelum menggunakan bind mount pada deployment baru. Gunakan backup konsisten SQLite bila memindahkan data yang sudah berjalan.

## 4. Cutover setelah staging lulus

Jalankan dalam jendela pemeliharaan yang disepakati. Hentikan container lama hanya setelah staging dan baseline publik diperiksa. Gateway lama disimpan agar dapat dimulai kembali.

```sh
docker stop antislop-gateway-test &&
  RUAS_GATEWAY_PORT=80 docker compose -p ruas-backend up -d --no-deps --no-build --pull never --wait --wait-timeout 60 gateway &&
  curl -fsS --max-time 5 http://localhost:80/api/health
```

Setelah health origin mengembalikan JSON RUAS, verifikasi dari koneksi yang dapat mengakses domain publik.

```sh
curl -fsS --max-time 10 -i "https://antislop.stei.fun/api/health?check=$(date +%s)"
curl -fsS --max-time 10 "https://antislop.stei.fun/api/openapi.json?check=$(date +%s)"
```

Pastikan HTTP 200, body health `{"status":"ok"}`, dan judul skema `RUAS Core Service`. Query `check` membedakan request verifikasi. Gateway mengirim `Cache-Control: no-store` pada respons API. Selama verifikasi, log gateway harus mencatat request yang sesuai. Pindah port hanya membuat ulang gateway dan mempertahankan core service beserta volume SQLite.

## 5. Rollback

Jika start gateway baru gagal atau health origin maupun publik meleset, hentikan gateway baru agar port 80 lepas lalu jalankan kembali container lama.

```sh
docker compose -p ruas-backend stop gateway &&
  docker start antislop-gateway-test
docker port antislop-gateway-test
```

Ulangi probe lokal dan publik dari langkah 2 dan cocokkan hasil dengan baseline. Core service dan volume SQLite tetap tersedia untuk investigasi. Untuk menguji perbaikan, ulangi staging pada 18080 sebelum cutover berikutnya. Pertahankan container uji dan volume existing selama rollback. Perintah `down -v`, `docker rm`, dan prune tidak diperlukan dalam prosedur ini.

Verifikasi development tersedia di [laporan testing](../testing/README.md). Hasil perintah pada STB, cutover Cloudflare, dan health domain publik perlu dicatat oleh operator setelah dijalankan.

## Upgrade STB existing ke Authentication

Upgrade `0.2.0` memindahkan core service ke image `ruas-core:0.2.0`. Gateway production, port host, dan konektor Cloudflare Tunnel tetap melayani origin yang sama. Volume production harus bernama `ruas-backend_core-data`. Lakukan cutover melalui sesi operator yang diotorisasi, setelah uji staging dan dalam jendela pemeliharaan.

### 1. Siapkan release dan periksa stack existing

Bila branch masih lokal, kirim commit yang disetujui dengan Git bundle dari komputer pengembangan.

```sh
git bundle create /tmp/ruas-auth-authorization.bundle feat/auth-authorization
scp /tmp/ruas-auth-authorization.bundle USER@HOST_STB:/tmp/
```

Pada STB, verifikasi `uname -m`, userspace 64 bit, Linux ARM64 pada `docker info`, kapasitas disk Docker dan USB, versi Compose, dan status Cloudflared. Pastikan port loopback staging 18080 kosong. Dari `docker compose ls -a`, tentukan file Compose yang saat ini dipakai proyek production `ruas-backend`. Sesuaikan lokasi contoh `RUAS_OLD_COMPOSE` sebelum melanjutkan. Pertahankan checkout lama karena gateway masih membaca file konfigurasi dari sana.

```sh
uname -m
getconf LONG_BIT
docker info --format '{{.OSType}}/{{.Architecture}} data={{.DockerRootDir}}'
docker compose version
systemctl is-active cloudflared
docker compose ls -a
sudo ss -ltnp '( sport = :80 or sport = :18080 )'
df -h "$(docker info --format '{{.DockerRootDir}}')" /mnt/usb-server

git clone --branch feat/auth-authorization /tmp/ruas-auth-authorization.bundle "$HOME/ruas-auth-authorization"
RUAS_OLD_COMPOSE="$HOME/ruas-backend-deployment/backend/docker-compose.yml"
RUAS_NEW_COMPOSE="$HOME/ruas-auth-authorization/backend/docker-compose.yml"
RUAS_PRIVATE=$(mktemp -d "$HOME/ruas-auth-private.XXXXXX")
unset RUAS_JWT_SECRET RUAS_GATEWAY_PORT

old_ruas() { docker compose -p ruas-backend -f "$RUAS_OLD_COMPOSE" "$@"; }
new_ruas() { docker compose --env-file "$RUAS_PRIVATE/production.env" -p ruas-backend -f "$RUAS_NEW_COMPOSE" "$@"; }
stage_ruas() { docker compose --env-file "$RUAS_PRIVATE/staging.env" -p ruas-auth-stage -f "$RUAS_NEW_COMPOSE" "$@"; }

old_ruas ps
RUAS_OLD_CORE=$(old_ruas ps -q core-service)
RUAS_OLD_IMAGE=$(docker inspect --format '{{.Config.Image}}' "$RUAS_OLD_CORE")
RUAS_OLD_VOLUME=$(docker inspect --format '{{range .Mounts}}{{if eq .Destination "/app/data"}}{{.Name}}{{end}}{{end}}' "$RUAS_OLD_CORE")
printf '%s\n' "$RUAS_OLD_VOLUME"
docker volume inspect --format '{{.Name}}' ruas-backend_core-data
docker image tag "$(docker inspect --format '{{.Image}}' "$RUAS_OLD_CORE")" ruas-core:pre-auth-rollback
```

Pastikan kedua pemeriksaan volume menunjukkan `ruas-backend_core-data`. Konfirmasi image lama berbeda dari `ruas-core:0.2.0`, status gateway healthy, dan health pada `http://127.0.0.1/api/health` serta `https://antislop.stei.fun/api/health` memberi respons baseline. Catat UUID satu laporan demo lama untuk verifikasi. Pastikan nama proyek staging belum dipakai.

Buat kunci berbeda untuk setiap environment dengan file privat. Pertahankan file `production.env` untuk restart berikutnya. Gunakan `config --quiet` agar hasil resolusi Compose yang memuat kunci tidak tercetak.

```sh
(
  umask 077
  set -C
  python3 -c 'import secrets; print("RUAS_JWT_SECRET=" + secrets.token_hex(32)); print("RUAS_GATEWAY_PORT=80")' > "$RUAS_PRIVATE/production.env"
  python3 -c 'import secrets; print("RUAS_JWT_SECRET=" + secrets.token_hex(32)); print("RUAS_GATEWAY_PORT=18080")' > "$RUAS_PRIVATE/staging.env"
)
new_ruas config --quiet
stage_ruas config --quiet
```

### 2. Backup konsisten SQLite

Gunakan SQLite Online Backup API dari container lama. Fungsi di bawah membuka sumber dalam mode baca, mengambil snapshot konsisten saat layanan berjalan, dan memeriksa `quick_check` pada hasilnya. Simpan backup di direktori privat. Verifikasi perintah sukses dan file berisi data sebelum menggunakannya. [SQLite Online Backup API](https://www.sqlite.org/backup.html).

```sh
ruas_backup() {
  old_ruas exec -T core-service python -c '
from contextlib import closing
from pathlib import Path
import shutil, sqlite3, sys, tempfile

with tempfile.TemporaryDirectory() as directory:
    path = Path(directory) / "backup.sqlite3"
    source = "file:/app/data/ruas.sqlite3?mode=ro"
    with closing(sqlite3.connect(source, uri=True)) as src, closing(sqlite3.connect(path)) as dst:
        src.backup(dst)
        if dst.execute("PRAGMA quick_check").fetchall() != [("ok",)]:
            raise SystemExit("SQLite quick_check failed")
    with path.open("rb") as snapshot:
        shutil.copyfileobj(snapshot, sys.stdout.buffer)
'
}
(umask 077; set -C; ruas_backup > "$RUAS_PRIVATE/staging.sqlite3") &&
  test -s "$RUAS_PRIVATE/staging.sqlite3"
```

### 3. Uji staging pada salinan SQLite

Staging menggunakan proyek `ruas-auth-stage`, volume `ruas-auth-stage_core-data`, dan port loopback 18080. Perintah impor memakai mode file eksklusif agar database staging yang sudah ada tidak ditimpa.

```sh
stage_ruas build core-service
stage_ruas pull gateway
stage_ruas run --rm --no-deps --pull never -T --entrypoint python core-service -c '
import shutil, sys
with open("/app/data/ruas.sqlite3", "xb") as target:
    shutil.copyfileobj(sys.stdin.buffer, target)
' < "$RUAS_PRIVATE/staging.sqlite3"
stage_ruas up -d --no-build --pull never --wait --wait-timeout 90
stage_ruas ps
curl -fsS http://127.0.0.1:18080/api/health
stage_ruas exec core-service python -m src.modules.identity.cli demo.user --role USER
stage_ruas exec core-service python -m src.modules.identity.cli demo.admin --role ADMIN
```

Periksa laporan demo lama pada port staging dan konfirmasi field lama tetap sama serta status baru `pending`. Untuk memakai Swagger pada komputer operator, buat SSH forward dengan `ssh -L 18080:127.0.0.1:18080 USER@HOST_STB`, lalu buka `http://127.0.0.1:18080/api/docs`. Jalankan skenario `401` tanpa token, `201` buat laporan sebagai USER, `403` verifikasi sebagai USER, dan `200` verifikasi sebagai ADMIN. Cocokkan health production dengan baseline. Hentikan stack staging setelah pengujian agar resource STB tersedia untuk cutover.

```sh
stage_ruas stop
```

### 4. Cutover core service dan verifikasi HTTPS

Buat snapshot baru tepat sebelum cutover. Lanjutkan hanya jika backup berhasil. Compose mengganti core pada proyek `ruas-backend`, memasang volume production yang sama, dan mempertahankan gateway existing. Core menjalankan migrasi satu transaksi saat startup. Perubahan skema menambah tabel `users` dan kolom `road_reports.verification_status` dengan default `pending`.

```sh
test "$RUAS_OLD_VOLUME" = ruas-backend_core-data &&
  docker volume inspect ruas-backend_core-data > /dev/null &&
  (umask 077; set -C; ruas_backup > "$RUAS_PRIVATE/pre-cutover.sqlite3") &&
  test -s "$RUAS_PRIVATE/pre-cutover.sqlite3" &&
  new_ruas up -d --no-deps --no-build --pull never --wait --wait-timeout 90 core-service
```

Periksa mount dan health origin. Nginx mungkin perlu beberapa detik untuk memperbarui IP core. Jika health pulih, buat akun demo production dengan password baru dan periksa endpoint HTTPS.

```sh
docker inspect --format '{{range .Mounts}}{{if eq .Destination "/app/data"}}{{.Name}}{{end}}{{end}}' "$(new_ruas ps -q core-service)"
curl -fsS http://127.0.0.1/api/health
new_ruas exec core-service python -m src.modules.identity.cli demo.user --role USER
new_ruas exec core-service python -m src.modules.identity.cli demo.admin --role ADMIN
curl -fsS "https://antislop.stei.fun/api/health?check=$(date +%s)"
curl -fsS "https://antislop.stei.fun/api/openapi.json?check=$(date +%s)"
```

Pastikan skema HTTPS menunjukkan versi `0.2.0` dan `RuasOAuth2`. Verifikasi laporan lama tetap dapat dibaca. Jalankan skenario Swagger menggunakan akun dan laporan demo pada `https://antislop.stei.fun/api/docs`. [Langkah demonstrasi](../api/README.md#demonstrasi-lewat-swagger-ui).

### 5. Rollback core ke versi sebelumnya

Jika startup, migrasi, atau smoke test gagal, gunakan konfigurasi dan image lama pada proyek yang sama. Pastikan variabel `RUAS_OLD_IMAGE` masih menunjuk ke referensi image sebelum cutover.

```sh
docker image tag ruas-core:pre-auth-rollback "$RUAS_OLD_IMAGE" &&
  old_ruas up -d --no-deps --no-build --pull never --wait --wait-timeout 90 core-service
curl -fsS http://127.0.0.1/api/health
curl -fsS "https://antislop.stei.fun/api/health?check=$(date +%s)"
```

Versi lama tetap dapat membaca laporan dan menulis ke tabel yang sudah dimigrasi karena kolom baru memiliki default. Tabel `users`, status verifikasi, dan laporan setelah snapshot tetap berada pada volume yang sama. Selama rollback, endpoint identity dan verifikasi tidak tersedia, dan POST laporan kembali ke perilaku publik versi lama. Backup adalah salinan pemulihan jika database rusak. Pemulihan dari snapshot memerlukan keputusan operator karena snapshot mendahului sebagian penulisan. Prosedur rollback aplikasi ini mempertahankan volume production.
