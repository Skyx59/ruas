# Laporan testing

## Status revisi 24 November 2026

Pemeriksaan lokal Windows memakai Python 3.13.1 dan Node.js 22.14.0. Backend v0.3.0: **53 tes lulus** mencakup metadata laporan, pemilik dari token, riwayat/statistik privat, larangan verifikasi sendiri, migrasi aditif/idempotensi, dan regresi JWT/RBAC. Jest mobile: **9 tes lulus** untuk batas konfigurasi client; ini bukan bukti seluruh fitur mobile telah diuji oleh Jest. Integrasi adapter aktual ke Uvicorn lokal lulus untuk pemetaan jenis/keparahan, filter kategori, pemisahan riwayat dua akun, statistik database, verifikasi ADMIN, penolakan verifikasi sendiri, dan privasi pemilik pada endpoint publik. Timeout HTTP juga diperiksa. Bundle JavaScript Android, konfigurasi Compose v0.3.0, dan `pip check` lulus. Hash 26 file UI sebelum/sesudah identik. Pengujian Expo Go pada perangkat fisik serta build ulang image ARM64 belum dilakukan dalam revisi ini.

Perubahan tidak mengakses STB, tidak menghidupkan layanan publik, dan tidak mengubah UI/Figma. STB belum up menurut pengguna. Dokumentasi StepSafe pada URL yang diberikan membalas 530/1033 sehingga integrasi mitra belum terverifikasi. Health/Faskes ditunda. Hasil lama di bawah merupakan catatan historis, bukan status fitur terbaru.

| Kebutuhan PWAM | Status aktual |
| --- | --- |
| Repo/README | Sumber dan petunjuk sudah diperbarui; akun uji diprovisikan operator, bukan login demo palsu |
| Layar/navigasi/form/login | Sembilan layar dan modal tersedia; autentikasi, laporan bertipe, riwayat/kontribusi menggunakan kontrak lokal |
| API sendiri + dua kelompok | RUAS terhubung; StepSafe menunggu kontrak yang bisa dibaca; Health ditunda |
| Loading/error/empty/API mati | Penanganan dasar dan timeout 15 detik; belum dinyatakan lengkap |
| Jest/laporan formal | Tes awal dan regresi backend tersedia; laporan PWAM PDF/uji integrasi dua kelompok belum tersedia |
| APK | Profil EAS tersedia; build APK/signing/package ID final belum tersedia |

## Historis: authentication dan authorization

Pengujian development pada 23 November 2026 menggunakan macOS ARM64, Python 3.12.3, Docker Engine 29.7.2 Linux ARM64, dan Docker Compose v5.4.0.

| Pemeriksaan | Hasil aktual |
| --- | --- |
| Seluruh pytest backend | **42 lulus, 0 gagal**. Mencakup regresi API, login USER/ADMIN, kredensial salah dan akun nonaktif, klaim serta signature JWT, `401` dan `403`, pencegahan eskalasi role, limit login, OpenAPI, dan migrasi data. |
| Seluruh test Jest mobile | **9 lulus, 0 gagal** pada Node.js 22.23.2. |
| `pip check`, `docker compose config --quiet`, dan build | Lulus. Image `ruas-core:0.2.0` dibangun untuk `linux/arm64`, memakai UID/GID `10001:10001` dan berukuran sekitar 50 MB. |
| Compose dan Nginx | Stack health lulus. Login, GET identitas, pembuatan laporan, `401` untuk request anonim, `403` untuk verifikasi oleh USER, dan `200` untuk ADMIN terverifikasi melalui gateway. |
| Swagger UI di Chrome | Form **Authorize** berhasil login sebagai USER. **Try it out** pada `GET /api/auth/me` mengembalikan `200` melalui gateway lokal. |
| CLI dengan terminal interaktif | Berhasil membuat USER dan ADMIN. Kedua akun berhasil dipakai login. |
| Backup, staging, cutover, dan rollback lokal | Backup Online SQLite lolos `quick_check`. Staging pada salinan mempertahankan laporan lama dengan status awal `pending`. Upgrade, rollback ke image lama, dan upgrade ulang pada volume uji yang sama mempertahankan akun, status verifikasi, serta laporan dari kedua versi. |

Pengujian menggunakan proyek Compose, volume, dan kredensial sementara di komputer development. Upgrade STB, migrasi production, dan smoke test HTTPS publik masih menunggu eksekusi operator.

## Pemeriksaan historis backend dan gateway

Pengujian development pada 23 November 2026 menggunakan macOS 26.5.2 ARM64, Python 3.12.3, Docker Desktop dengan Engine 29.7.2 Linux ARM64, Compose v5.4.0, dan Nginx 1.30.7.

| Pemeriksaan | Hasil aktual |
| --- | --- |
| `python -m pytest -q` | **21 lulus, 0 gagal**. Mencakup health, pembuatan laporan, daftar dan detail, validasi koordinat, deskripsi, UUID, pagination dan JSON, format error, OpenAPI, konfigurasi, serta persistensi lintas instance aplikasi. |
| Uvicorn langsung dari virtualenv | HTTP 200 pada `http://127.0.0.1:8000/api/health` dengan SQLite temporer. |
| `docker compose config --quiet` | Lulus untuk port 80 dan port staging 18080. |
| `docker compose build core-service` | Lulus untuk `linux/arm64`. Docker melaporkan image sekitar 49 MB dan user `10001:10001`. |
| Health Compose dan `nginx -t` | Core dan gateway `healthy`, konfigurasi Nginx valid. |
| `curl -4 -fsS http://localhost:80/api/health` | HTTP 200 dengan `{"status":"ok"}` melalui Nginx → FastAPI → SQLite. Host header publik dan skema OpenAPI juga diuji secara lokal. |
| Laporan melalui gateway | POST valid `201`, daftar dan detail `200`, POST dengan koordinat salah `422`, dan root gateway `404`. |
| Persistensi dan pindah port | Laporan tetap dapat dibaca setelah core service dibuat ulang. Gateway diuji pada 18080 lalu 80 dengan core service dan volume yang sama. |
| Simulasi cutover dan rollback lokal | Nginx uji tetap melayani port 80 selama staging. Setelah cutover, RUAS melayani port 80. Rollback memulai kembali container Nginx uji yang sama dan data RUAS tetap tersedia. |
| Batas resource di Docker | `docker inspect` mengonfirmasi core 0,50 CPU/256 MiB, gateway 0,25 CPU/64 MiB, core tanpa port host dan gateway hanya di `127.0.0.1`. |
| `pip check` | Lulus di virtualenv pengembangan dan image runtime. |

`localhost` tanpa `-4` memilih Apache yang sudah berjalan pada loopback IPv6 di komputer uji dan mengembalikan 404. Probe `-4` dan `127.0.0.1` mengarah ke gateway RUAS. Pengujian di STB ZTE B860H, cutover container existing, dan verifikasi HTTPS lewat Cloudflare adalah langkah setelah deployment. Hasilnya masih menunggu eksekusi operator di server.

## Pemeriksaan historis mobile

Pemeriksaan scaffold pada 22 November 2026 menggunakan Windows, Node.js 22.14.0, npm 10.9.2, Expo 58.0.26, dan React Native 0.88.1. Belum ada pengujian fitur bisnis atau integrasi API nyata.

| Pemeriksaan | Hasil aktual |
| --- | --- |
| Inisialisasi template resmi Expo `blank` JavaScript | Berhasil, tanpa repository Git bersarang |
| Instalasi dependency dan `npm ls --depth=0` | Berhasil; dependency langsung terpasang, lockfile tersedia, Jest berada pada devDependencies |
| `expo config --type public` | Lulus; nama RUAS, slug ruas, SDK 58, platform Android/iOS |
| `expo install --check` dengan akses metadata online | Lulus: dependencies are up to date |
| `npm test -- --runInBand` | Lulus: 1 suite, 9 test |
| `expo export --platform android --output-dir ../.cache/mobile-export --max-workers 1 --no-bytecode` | Lulus: 861 modul berhasil dibundel; hasil lokal diabaikan Git |
| Parse JavaScript dan pemeriksaan komentar source | Lulus untuk 21 file JavaScript; tidak ada komentar source |
| Parse JSON konfigurasi | Lulus untuk app.json, eas.json, dan package.json |
| Aturan ignore | `.env`, dependency, data runtime, serta artefak build diabaikan; `.env.example` tetap tersedia untuk Git |
| Pelestarian file awal | LICENSE identik; dua baris README asli dipertahankan dan dokumentasi ditambahkan |

Ekspor di atas hanya memvalidasi bundle JavaScript Android tanpa kompilasi bytecode Hermes. Pemeriksaan ini bukan build APK, pengujian perangkat/emulator, validasi native Android/iOS, atau bukti integrasi API. Navigasi secara interaktif pada perangkat belum diuji. Pada lingkungan pemeriksaan, CLI dipanggil melalui Node.js langsung untuk menghindari kendala izin wrapper npm lokal; konfigurasi sistem tidak diubah.

`npm audit` mencatat 22 entri dependency terdampak berstatus moderate, tanpa high atau critical, melalui rantai `glob` dan `minimatch` pada tooling Expo/Jest. Jumlah tersebut mencakup dependency induk, bukan 22 kerentanan unik. Temuan perlu ditinjau sebelum release; pembaruan paksa yang dapat mengubah versi SDK tidak dijalankan.

Jest disiapkan di mobile dengan preset `jest-expo`. Test awal memeriksa bahwa request ditolak sebelum base URL diisi dan bahwa client tidak menerima URL lintas layanan atau konfigurasi tidak sesuai. Stub `fetch` hanya digunakan sebagai penjaga agar unit test tidak mengirim request jaringan; bukan simulasi API RUAS, StepSafe, atau Health.

Checklist pengembangan PWAM:

| Kebutuhan | Status scaffold historis |
| --- | --- |
| Stack + Tab, minimal empat layar | Struktur navigasi dan tujuh layar placeholder tersedia |
| Login | Layar tersedia; form dan autentikasi belum diimplementasikan |
| State management | Context dan hook sesi awal tersedia; belum terhubung autentikasi |
| Form dan validasi | Belum diimplementasikan |
| Loading/error/empty | Belum diimplementasikan pada alur data layar |
| API sendiri + StepSafe + Health | Client terpisah tersedia; kontrak dan integrasi nyata belum tersedia |
| Jest | Konfigurasi dan unit test awal tersedia |
| EAS APK release | Profil `release-apk` tersedia; akun/project, package ID, signing, dan build belum disiapkan |

Laporan fitur berikutnya perlu memuat environment, versi aplikasi, langkah uji, hasil aktual, bukti, dan batas pengujian. Sertakan uji otorisasi, input tidak valid, data kosong, jaringan gagal, data lingkungan kedaluwarsa, serta konsistensi aturan risiko setelah fitur terkait dibuat.
