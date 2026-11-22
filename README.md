# ruas
RUAS - Risk-Aware Urban Route Recommendation System

RUAS menyiapkan rekomendasi rute perkotaan dengan mempertimbangkan risiko banjir, kemacetan, cuaca, waktu tempuh, jarak, dan kondisi ruas jalan. Laporan masyarakat dikelola dan diverifikasi, lalu digunakan bersama data lingkungan untuk evaluasi risiko berbasis aturan.

## Status proyek

Repository ini memakai struktur monorepo. Backend masih scaffold. Mobile sudah memiliki sembilan layar JavaScript/Expo berdasarkan Figma v3, navigasi Stack + Tab, state bersama, form dan validasi, serta antarmuka adapter RUAS, StepSafe, dan Health. Login dan operasi layanan nyata menunggu kontrak API yang terverifikasi. Lihat [README mobile](mobile/README.md) untuk menjalankan aplikasi dan membedakan mode layanan dari preview demo.

Pemeriksaan scaffold terdahulu dicatat di [laporan testing awal](docs/testing/README.md). Status implementasi Person B terbaru berada di README mobile; laporan testing formal dan APK belum tersedia.

RUAS, StepSafe, dan kelompok Health & Wellbeing adalah tiga aplikasi independen dengan backend serta database masing-masing. Integrasi menggunakan kontrak REST, tanpa database bersama atau penggabungan source code.

## Struktur repository

```text
ruas/
├── backend/
│   ├── core-service/
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── road-conditions/
│   │       │   ├── route-recommendation/
│   │       │   ├── environment/
│   │       │   └── identity/
│   │       ├── routes/
│   │       ├── middleware/
│   │       └── config/
│   ├── gateway/
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
│   └── demo/
├── LICENSE
├── README.md
└── .gitignore
```

Direktori kosong memiliki `.gitkeep`. Tidak ada konfigurasi workspace Node di root karena stack backend belum dipilih; dependency mobile dikelola dari `mobile/`.

## Pembagian backend dan mobile

`backend/core-service/` menampung empat bounded context sebagai modul internal satu microservice: Road Condition Management, Route Recommendation, Environmental Data Integration, serta Identity and Access Management. Bahasa, framework, dan database belum ditentukan. `backend/gateway/` disediakan untuk Nginx.

Target runtime STB Armbian: core service dalam Docker, gateway Nginx, Cloudflare Tunnel untuk akses HTTPS, serta komponen pendukung yang diperlukan. Frontend, mobile build, model AI berat, dan layanan integrasi antarkelompok tidak dijalankan pada STB. Dockerfile, Compose, konfigurasi gateway/tunnel, dan perintah menjalankan backend **belum tersedia**. Tidak ada deployment atau perubahan STB dalam scaffold ini.

`mobile/` menggunakan JavaScript, React Native, dan Expo. Tab memisahkan Home, Peta, Lapor, Faskes, dan Profil. Stack menyediakan Rekomendasi Rute, Detail Laporan, Login, dan Registrasi. State sesi hanya dapat berasal dari adapter autentikasi nyata; tidak ada akun atau login demo palsu. Data contoh untuk preview diberi label dan tidak menjadi pengganti integrasi API. Ketergantungan Person A/mitra dicatat di [handoff integrasi](docs/integration/mobile-handoff.md), termasuk perbedaan Health–Tourism pada DDD PDF dengan rencana StepSafe–Health.

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

Salin environment hanya jika `.env` belum ada. Base URL boleh tetap kosong untuk membuka aplikasi; pilih Home → Lihat demo untuk preview data contoh berlabel. Untuk pemanggilan nyata, isi URL resmi dan implementasikan adapter berdasarkan kontrak masing-masing kelompok. Tidak ada request ke server contoh.

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

Test yang sudah ada berasal dari scaffold; belum membuktikan fitur bisnis, API nyata, atau perilaku pada perangkat. UI, form/validasi, pemilihan lokasi/fasilitas, dan pilihan rute sudah tersedia. Autentikasi serta pelaporan/rekomendasi nyata menunggu backend. Penyelesaian loading/error/empty menyeluruh, laporan testing formal, dan release tetap ditunda.

## Persiapan APK

`mobile/eas.json` menyediakan profil `release-apk` dengan `android.buildType: apk`, mengikuti [panduan APK Expo](https://docs.expo.dev/build-reference/apk/). Profil ini tidak menggunakan development client. Build APK **belum dijalankan** dan belum tersedia sebagai artefak.

Sebelum build, tetapkan Android application/package ID yang disepakati, hubungkan akun/project EAS, siapkan signing di luar Git, tentukan base URL publik, dan selesaikan pengujian perangkat. Perintah tahap berikutnya, setelah prasyarat tersebut dipenuhi, adalah `npx eas-cli build --platform android --profile release-apk` dari `mobile/`, pada komputer pengembangan atau EAS; bukan STB. Tidak ada project ID atau kredensial rekaan dalam konfigurasi.

## Dokumentasi dan kelanjutan

- [DDD](docs/ddd/README.md): bounded context dan keputusan domain yang perlu dilengkapi.
- [Kontrak API](docs/api/README.md): cakupan kontrak RUAS, StepSafe, dan Health.
- [Kesepakatan integrasi](docs/integration/README.md): kepemilikan data dan batas antarkelompok.
- [Testing](docs/testing/README.md): status verifikasi dan checklist PWAM.
- `docs/demo/`: tempat materi demo setelah tersedia.

Langkah berikutnya adalah Person A memilih stack backend yang sesuai STB dan menyepakati kontrak REST/autentikasi dengan mitra, lalu mengisi adapter dan memverifikasi satu alur end-to-end. Detail aturan pembobotan risiko tetap menjadi tanggung jawab layanan RUAS. Tidak ada deployment, commit, atau push otomatis dalam pekerjaan mobile ini.
