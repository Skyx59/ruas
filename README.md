# ruas
RUAS - Risk-Aware Urban Route Recommendation System

RUAS menyiapkan rekomendasi rute perkotaan dengan mempertimbangkan risiko banjir, kemacetan, cuaca, waktu tempuh, jarak, dan kondisi ruas jalan. Laporan masyarakat dikelola dan diverifikasi, lalu digunakan bersama data lingkungan untuk evaluasi risiko berbasis aturan.

## Status proyek

Backend menyediakan health check, login OAuth2 Bearer JWT, identitas pengguna, dan alur buat, daftar, serta baca laporan kondisi jalan. Aksi verifikasi tersedia untuk ADMIN. Kontrak laporan bersifat sementara (*provisional*) dan menunggu persetujuan kelompok. Mobile menggunakan Expo JavaScript dengan navigasi Stack + Tab dan tujuh layar placeholder.

Validasi awal mobile berhasil: konfigurasi Expo, kecocokan dependency, sembilan unit test, serta ekspor bundle JavaScript Android lokal. Aplikasi belum diuji pada perangkat dan belum dibangun menjadi APK. Hasil audit dependency dan batas pemeriksaan dicatat di [laporan testing](docs/testing/README.md).

RUAS, StepSafe, dan kelompok Health & Wellbeing adalah tiga aplikasi independen dengan backend serta database masing-masing. Integrasi menggunakan kontrak REST, tanpa database bersama atau penggabungan source code.

## Struktur repository

```text
ruas/
├── backend/
│   ├── core-service/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── tests/
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── road_conditions/
│   │       │   ├── route-recommendation/
│   │       │   ├── environment/
│   │       │   └── identity/
│   │       ├── routes/
│   │       ├── middleware/
│   │       └── config/
│   ├── gateway/
│   │   └── default.conf
│   ├── docker-compose.yml
│   └── .env.example
├── mobile/
│   ├── assets/
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── navigation/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── theme/
│   │   ├── utils/
│   │   └── tests/
│   ├── App.js
│   ├── app.json
│   ├── eas.json
│   └── package.json
├── docs/
│   ├── ddd/
│   ├── api/
│   ├── integration/
│   ├── testing/
│   ├── demo/
│   └── deployment/
├── LICENSE
├── README.md
└── .gitignore
```

Direktori kosong memiliki `.gitkeep`. Dependency mobile dikelola di `mobile/` dan dependency Python di `backend/core-service/`.

## Arsitektur backend

```text
Client ── HTTPS ── Cloudflare Tunnel ── localhost:80 ── Nginx
                                                         │ /api/*
                                                         ▼
                                                FastAPI + Uvicorn :8000
                                                         │
                                                 SQLite di volume Docker
```

RUAS memakai modular monolith berbasis Python 3.12, FastAPI, Pydantic v2, Uvicorn, dan SQLite. Satu core service menampung Road Condition Management, Route Recommendation, Environmental Data Integration, serta Identity and Access Management. Road Condition Management menyimpan laporan dan status verifikasi. Identity and Access Management menyediakan akun SQLite, Argon2id, access token JWT dengan masa berlaku 30 menit, dan RBAC USER/ADMIN. Route Recommendation dan Environmental Data Integration masih berupa struktur kode. Nginx Alpine menjadi gateway HTTP dan mempertahankan prefix `/api` saat meneruskan request. Cloudflare Tunnel yang sudah berjalan pada STB menangani akses publik HTTPS.

Compose membatasi core service ke 0,5 CPU dan 256 MiB, serta gateway ke 0,25 CPU dan 64 MiB. Port 80 diikat ke loopback host untuk Cloudflared. Core service berada di network internal dan menggunakan volume `core-data` untuk SQLite.

## Menjalankan backend

Dari root repository, masuk ke `backend/` lalu buat `.env` dengan secret acak untuk instalasi baru. Jika file sudah tersedia, pertahankan isinya dan pastikan variabel `RUAS_JWT_SECRET` ada. Jalankan Compose dan periksa health melalui gateway.

```sh
cd backend
(umask 077; set -C; python3 -c 'import secrets; print("RUAS_JWT_SECRET=" + secrets.token_hex(32))' > .env)
docker compose config --quiet
docker compose up -d --build --wait
curl -4 -fsS http://localhost:80/api/health
```

Respons health yang diharapkan adalah `{"status":"ok"}`. Swagger UI tersedia di `http://127.0.0.1/api/docs` dan skema di `http://127.0.0.1/api/openapi.json`. Untuk menjalankan FastAPI langsung, gunakan langkah Python dan konfigurasi di [README core service](backend/core-service/README.md).

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| GET | `/api/health` | Memeriksa kesiapan API dan akses baca SQLite |
| POST | `/api/auth/token` | Login dengan form dan menerima JWT |
| GET | `/api/auth/me` | Membaca identitas akun yang login |
| POST | `/api/road-reports` | Membuat laporan sebagai USER atau ADMIN |
| GET | `/api/road-reports` | Membaca daftar dengan parameter `limit` dan `offset` |
| GET | `/api/road-reports/{report_id}` | Membaca detail laporan menurut UUID |
| PATCH | `/api/road-reports/{report_id}/verification` | Mengubah status verifikasi sebagai ADMIN |
| GET | `/api/docs` | Membuka Swagger UI |
| GET | `/api/openapi.json` | Membaca skema OpenAPI |

Contoh payload, respons, dan status error tersedia di [Kontrak API](docs/api/README.md). Buat akun demo melalui CLI interaktif, lalu login melalui tombol **Authorize** di Swagger UI. Untuk STB existing, gunakan panduan upgrade dengan backup SQLite, staging terpisah, dan rollback menggunakan volume yang sama. [Modul Identity](backend/core-service/src/modules/identity/README.md) · [Runbook STB](docs/deployment/README.md#upgrade-stb-existing-ke-authentication) · [Laporan testing](docs/testing/README.md)

## Aplikasi mobile

`mobile/` menggunakan JavaScript, React Native, dan Expo. Tab memisahkan Beranda dan Peta, Rekomendasi Rute, Form Laporan, Fasilitas Kesehatan, serta Akun/Profil. Stack menyediakan Detail dan Konfirmasi Laporan serta Login. Semua layar menampilkan status scaffold. Context sesi awal bukan implementasi autentikasi, dan tombol navigasi tidak mengirim laporan atau melakukan login.

## Persyaratan pengembangan mobile

- Node.js LTS 22.13+ pada lini 22, 24.3+ pada lini 24, atau 26+ sesuai `engines` React Native 0.88.1, serta npm. Pemeriksaan scaffold menggunakan Node.js 22.14.0.
- Akses registry npm untuk instalasi dependency.
- Expo Go yang kompatibel dengan SDK pada `mobile/package.json`, atau development build yang sesuai. Android emulator dapat digunakan melalui Android Studio; simulator iOS memerlukan macOS/Xcode.
- Akun dan project Expo/EAS serta konfigurasi signing diperlukan pada tahap APK release, bukan untuk mengisi scaffold.

Template awal berasal dari [template blank resmi Expo](https://docs.expo.dev/more/create-expo/), tanpa TypeScript atau Expo Router. Navigasi menggunakan React Navigation. Status pemeriksaan aktual dicatat di [laporan testing](docs/testing/README.md).

Jalankan perintah berikut di komputer pengembangan setelah dependency dapat diinstal:

```powershell
cd mobile
npm ci
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm start
```

Salin environment hanya jika `.env` belum ada. Base URL boleh tetap kosong untuk membuka layar scaffold. Untuk pemanggilan nyata, isi URL resmi dari masing-masing kelompok; endpoint dan method domain menunggu kontrak final. Nilai kosong menyebabkan client menolak request, bukan mengarah ke server contoh.

```text
EXPO_PUBLIC_RUAS_API_BASE_URL=
EXPO_PUBLIC_STEPSAFE_API_BASE_URL=
EXPO_PUBLIC_HEALTH_API_BASE_URL=
```

Nilai `EXPO_PUBLIC_` terlihat dalam bundle aplikasi menurut [dokumentasi environment Expo](https://docs.expo.dev/guides/environment-variables/). Jangan memasukkan API key rahasia, password, atau secret server. Client RUAS, StepSafe, dan Health terpisah serta tidak mengasumsikan endpoint, skema payload, atau token bersama. Transport umum mengembalikan `Response`; parsing dan autentikasi ditambahkan setelah kontrak disepakati. Tidak ada request API otomatis atau data integrasi palsu.

Perintah pemeriksaan dari `mobile/` setelah instalasi:

```powershell
npx expo config --type public
npx expo install --check
npm test -- --runInBand
```

Pengujian ini hanya untuk scaffold; belum membuktikan fitur bisnis, API nyata, atau perilaku pada perangkat. Form dan validasi, loading/error/empty, autentikasi, peta, pelaporan, dan rekomendasi rute belum diimplementasikan.

## Persiapan APK

`mobile/eas.json` menyediakan profil `release-apk` dengan `android.buildType: apk`, mengikuti [panduan APK Expo](https://docs.expo.dev/build-reference/apk/). Profil ini tidak menggunakan development client. Build APK **belum dijalankan** dan belum tersedia sebagai artefak.

Sebelum build, tetapkan Android application/package ID yang disepakati, hubungkan akun/project EAS, siapkan signing di luar Git, tentukan base URL publik, dan selesaikan pengujian perangkat. Perintah tahap berikutnya, setelah prasyarat tersebut dipenuhi, adalah `npx eas-cli build --platform android --profile release-apk` dari `mobile/`, pada komputer pengembangan atau EAS; bukan STB. Tidak ada project ID atau kredensial rekaan dalam konfigurasi.

## Dokumentasi dan kelanjutan

- [DDD](docs/ddd/README.md): bounded context dan keputusan domain yang perlu dilengkapi.
- [Kontrak API](docs/api/README.md): cakupan kontrak RUAS, StepSafe, dan Health.
- [Kesepakatan integrasi](docs/integration/README.md): kepemilikan data dan batas antarkelompok.
- [Testing](docs/testing/README.md): hasil backend lokal dan checklist PWAM.
- [Deployment STB](docs/deployment/README.md): preflight, staging, cutover, dan rollback.
- `docs/demo/`: tempat materi demo setelah tersedia.

Kelompok masih perlu menetapkan kontrak dan versi REST final, aturan moderasi dan transisi status laporan, kebijakan akun dan publikasi data, sumber data lingkungan, serta pembobotan risiko. Akses baca publik masih provisional untuk demo. Rekomendasi rute, pembobotan risiko, integrasi cuaca/banjir, serta integrasi StepSafe dan Health masih menunggu kontrak dan aturan domain. README dan tautan dokumentasinya dapat digunakan sebagai materi README.pdf TST.
