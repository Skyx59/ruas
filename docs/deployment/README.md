# Deployment RUAS pada STB Armbian

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
