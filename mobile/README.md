# RUAS mobile

RUAS (Risk-Aware Urban Route Recommendation System) membantu pengguna membandingkan rute berdasarkan kondisi jalan, banjir, kemacetan, cuaca, waktu, dan jarak. Aplikasi ini menggunakan JavaScript, React Native, Expo SDK 58, dan React Navigation Stack + Tab.

## Cakupan pekerjaan Person B

Implementasi ini mencakup PWAM butir 1–3. Sembilan layar, interaksi navigasi, state bersama, form, validasi, serta antarmuka adapter API tersedia. Login nyata, pengiriman/verifikasi laporan, rekomendasi nyata, dan integrasi kedua kelompok belum dapat dinyatakan selesai karena belum ada kontrak backend atau penyedia yang dapat diverifikasi.

Backend, database, deployment STB, Nginx, dan Cloudflare tidak diubah. Tidak ada release build, APK, PDF testing, atau commit/push otomatis dalam pekerjaan ini. File Jest dan EAS dari scaffold sebelumnya dipertahankan; keberadaannya tidak berarti butir 4–6 selesai.

## Sumber yang diperiksa

- PDF lokal `1794269199736_1_Tugas-Besar-TST-PWAM-1.pdf` di Downloads: slide 3–5, 19–24, dan 26–27. Slide 22 memisahkan deliverable repositori, fitur, ApiService, penanganan kondisi, testing, serta APK.
- PDF lokal `Konteks_Tubes 1 Merancang Layanan Inti Dengan DDD .pdf` di Downloads: bagian A–C. Pelaporan/verifikasi dan evaluasi risiko adalah tanggung jawab domain RUAS; mobile tidak menghitung skor risiko atau Walkability Index sendiri.
- [Figma High-Fidelity v3](https://www.figma.com/design/OuhT7b8hjin2ERRz6mVqwy?node-id=17-211), sembilan frame `17:220`, `17:296`, `17:379`, `17:429`, `17:497`, `17:535`, `17:599`, `17:658`, dan `17:693`. Font Inter, palet, chip 36 px, gap 8 px, margin 16 px, kartu, dan indikator tab mengikuti sumber tersebut. Aset Figma disimpan lokal, tanpa URL aset sementara saat runtime. Desain v4 tidak digunakan dan file Figma tidak diubah.
- Repository lokal: backend masih scaffold; `docs/api/` belum memuat endpoint, OpenAPI, Postman, atau skema respons yang telah disepakati.

DDD PDF masih mencantumkan **Health–Tourism** sebagai asumsi awal. Rencana mobile pada tugas ini menggunakan **StepSafe–Health**. Perbedaannya dicatat di [handoff integrasi](../docs/integration/mobile-handoff.md) untuk disinkronkan dengan Person A, tanpa mengubah dokumen DDD diam-diam.

## Persyaratan dan menjalankan aplikasi

- Node.js `^22.13.0 || ^24.3.0 || >=26.0.0`, npm, dan akses registry npm untuk instalasi awal.
- Expo Go yang kompatibel dengan SDK 58 atau development build yang sesuai. Emulator Android dapat digunakan; simulator iOS memerlukan macOS/Xcode.
- Peta native menggunakan `react-native-maps`. Expo Go dapat dipakai untuk pemeriksaan awal; konfigurasi penyedia peta untuk binary aplikasi perlu ditentukan sebelum tahap build native, sesuai [panduan Expo](https://docs.expo.dev/versions/latest/sdk/map-view/).

Dari root repository:

```powershell
cd mobile
npm ci
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm start
```

`npm run android` membuka target Android. `npm run ios` digunakan pada lingkungan iOS yang sesuai. `npm run web` menyediakan preview UI lokal; peta interaktif native tidak tersedia pada web sehingga pemilihan titik di web menggunakan input koordinat manual.

## Environment dan mode data

```text
EXPO_PUBLIC_RUAS_API_BASE_URL=
EXPO_PUBLIC_STEPSAFE_API_BASE_URL=
EXPO_PUBLIC_HEALTH_API_BASE_URL=
EXPO_PUBLIC_ENABLE_DEMO=false
```

Isi base URL hanya dengan alamat resmi yang telah dikonfirmasi kelompok pemiliknya. Tidak ada URL, endpoint, atau kredensial bawaan. Mengisi base URL saja belum mengaktifkan integrasi: adapter harus ditulis berdasarkan kontrak aktual.

Semua `EXPO_PUBLIC_*` masuk ke bundle aplikasi. Jangan menyimpan API key privat atau rahasia server di dalamnya. Jika API mitra memerlukan key privat, Person A perlu menyediakan mekanisme server-side di luar STB untuk integrasi tersebut. Mekanisme autentikasi masing-masing penyedia tetap terpisah; sesi RUAS tidak diteruskan otomatis ke mitra.

Mode default adalah mode layanan tanpa data palsu. Tekan **Home → Lihat demo** untuk melihat data contoh, atau atur `EXPO_PUBLIC_ENABLE_DEMO=true` untuk preview. Layar data selalu menampilkan label **MODE DEMO · Data contoh, bukan API**. Tekan **Tutup demo** untuk kembali ke mode layanan. Pergantian mode mengosongkan pilihan perjalanan, lokasi laporan, dan rute aktif agar data contoh tidak ikut dipakai sebagai data nyata.

Data contoh berada terpisah di `src/preview/demoData.js`, bukan respons tiruan layanan. Contoh ETA/jarak/risiko hanya untuk perjalanan Kampus ITB → RS Hasan Sadikin dengan kendaraan; perjalanan atau mode lain tidak diberi angka rekaan. Memilih Rute A/B mengaktifkan pilihan lokal untuk preview, bukan navigasi turn-by-turn atau hasil evaluasi baru. Tidak ada Walkability Index contoh. Tidak ada akun demo, password demo, token demo, atau login lokal palsu. Laporan dan konfirmasi pada mode demo tidak dikirim atau ditandai berhasil.

## Layar dan interaksi

| Navigator | Layar | Yang tersedia |
| --- | --- | --- |
| Tab | Home | Header, kartu cuaca, jumlah laporan aktif, rute aktif, input asal/tujuan, GPS, pilihan titik di peta, akses rekomendasi dan peta lengkap |
| Tab | Peta | Pencarian laporan, filter Semua/Banjir/Macet/Hambatan, penanda yang mengikuti filter, ringkasan laporan, detail, pemilihan koordinat |
| Tab | Lapor | Lokasi peta/GPS/manual, jenis, keparahan, deskripsi, pemilihan dan penghapusan foto opsional, validasi, aksi submit yang menunggu adapter |
| Tab | Faskes | Pencarian, kategori, daftar, detail dan koordinat fasilitas, penanda, pilihan fasilitas sebagai tujuan |
| Tab | Profil | Akun pengunjung atau sesi dari layanan, ringkasan kontribusi jika tersedia, riwayat/status, Login/Registrasi, logout sesi nyata |
| Stack | Rekomendasi Rute | Asal/tujuan, pilihan kendaraan/jalan kaki, alternatif, ETA/jarak/risiko dari sumber data, pemilihan rute, slot StepSafe untuk jalan kaki |
| Stack | Detail Laporan | Jenis, lokasi, waktu, keparahan, status, pelapor, deskripsi, aksi konfirmasi yang menunggu adapter |
| Stack | Login | Email/password, validasi, tampil/sembunyikan password, pemanggilan adapter, sesi hanya dari hasil autentikasi nyata |
| Stack | Registrasi | Nama, email, password/konfirmasi, validasi, hasil hanya setelah adapter mengonfirmasi registrasi |

Form menampilkan alasan validasi di dekat field. Registrasi mengikuti desain: password minimal delapan karakter dan konfirmasi harus cocok. Laporan memerlukan koordinat valid, jenis/keparahan yang didukung, dan deskripsi terisi maksimal 300 karakter. Foto opsional dengan format JPG/PNG, dipilih dari galeri dan belum diunggah sebelum adapter melakukan pengiriman. Upload multipart atau penyimpanan bukti belum diasumsikan.

Nama asal/tujuan disimpan sebagai label; aplikasi tidak membuat koordinat palsu dari teks alamat. Koordinat dapat berasal dari GPS, ketukan peta native, input manual, atau hasil Health yang dinormalisasi adapter. Pencarian/geocoding alamat untuk request rekomendasi perlu disesuaikan dengan kontrak Person A.

`AppContext` berbagi laporan, fasilitas, perjalanan, rute terpilih/aktif, lokasi laporan, dan sesi. Home, Peta, dan Detail mengambil laporan dari koleksi yang sama berdasarkan ID. Rute menuju fasilitas mempertahankan nama dan koordinat tujuan. Penyimpanan sesi saat ini hanya di memori; restart aplikasi memerlukan login kembali. Penyimpanan token permanen/refresh session menunggu kontrak autentikasi.

## ApiService dan adapter

`src/services/ApiService.js` memisahkan operasi UI dari kontrak HTTP. Tiga client yang sudah ada tetap digunakan melalui `config.js` dan `createApiClient.js`. `serviceAdapters.js` sengaja berisi `null` untuk ketiga layanan sampai kontrak aktual tersedia.

| Layanan | Operasi antarmuka internal mobile | Endpoint nyata terhubung |
| --- | --- | --- |
| RUAS | `listReports`, `getWeather`, `recommendRoutes`, `createReport`, `confirmReport`, `login`, `register`, `logout`, `getProfile` | Tidak ada |
| StepSafe | `getWalkability` | Tidak ada |
| Health | `listFacilities` | Tidak ada |

Nama operasi di atas adalah antarmuka kode mobile, **bukan** path endpoint, method HTTP, atau nama field API penyedia. Bila adapter belum tersedia, `ContractUnavailableError` dilempar sebelum request jaringan. Tidak ada fallback otomatis dari API gagal ke data demo.

Untuk menghubungkan kontrak, isi adapter penyedia dengan fungsi operasi yang menerima `{ client, input, session }`. Fungsi tersebut harus menentukan path/method, autentikasi, serialisasi, parsing respons, dan pemetaan data sesuai OpenAPI/Postman/kode yang benar-benar disepakati. Transport `client.request(path, options)` mengembalikan `Response`; adapter yang menentukan cara membacanya. Sesi yang diterima adapter mitra saat ini `null`; jangan meneruskan token RUAS tanpa kontrak eksplisit.

Model tampilan internal yang dipakai komponen, bukan usulan skema REST:

- Titik perjalanan: `label`, `coordinate: { latitude, longitude }`, serta `source` bila relevan.
- Laporan: `id`, `type`, `title`, `location`, `timeLabel`, `severity`, `status`, `reporterLabel`, `description`; `ownerId` untuk mengaitkan riwayat akun bila tersedia. Status tampilan `pending/verified/resolved` harus dipetakan dari kontrak penyedia, bukan diasumsikan sama dengan field API.
- Fasilitas: `id`, `name`, `category`, `address`, `location`. Ikon menggunakan bangunan sesuai v3.
- Alternatif rute: `id`, `name`, `durationLabel`, `distanceLabel`, `riskLabel`, `riskTone`, `recommended`, `explanation`, `viaLabel`, dan `geometry` bila layanan menyediakan koordinat jalur. Mobile tidak menghubungkan dua titik dengan garis lalu mengklaimnya sebagai rute.
- Sesi: `account` dengan `id`, `displayName`, dan `email`; material autentikasi lain hanya sesuai normalisasi adapter. `login` harus menghasilkan akun valid sebelum state sesi berubah. `register` mengembalikan `accepted: true` hanya setelah registrasi benar-benar dikonfirmasi layanan; tidak otomatis membuat sesi.
- Profil: `statistics` dengan angka kontribusi dari layanan. Tanpa data, UI menampilkan `—`, bukan angka kontribusi rekaan.
- Cuaca: `locationLabel`, `temperatureLabel`, `description`, `updatedLabel`. StepSafe: `summary` dan `indexLabel` yang sudah dipetakan dari respons nyata. Mobile tidak menurunkan indeks sendiri.

Detail kebutuhan Person A dan kelompok mitra ada di [handoff](../docs/integration/mobile-handoff.md). Belum ada request/respons nyata yang dapat digunakan untuk menyatakan integrasi berhasil.

## Pemeriksaan lokal dan pekerjaan berikutnya

Konfigurasi dan bundle JavaScript dapat diperiksa dari folder mobile:

```powershell
npx expo config --type public
npx expo install --check
npx expo export --platform android --output-dir ../.cache/mobile-android --max-workers 1 --no-bytecode
```

Pemeriksaan lokal pada 23 November 2026: konfigurasi publik Expo valid; `expo install --check` menyatakan dependency sesuai; ekspor JavaScript Android berhasil (1.150 modul), dan ekspor web berhasil. Pemeriksaan interaksi browser pada sembilan layar lulus untuk navigasi/kembali, filter laporan dan fasilitas, penanda/detail, input koordinat dan perpindahannya, validasi laporan/login/registrasi, penolakan autentikasi tanpa kontrak, fasilitas sebagai tujuan, aktivasi rute demo, slot StepSafe, serta isolasi mode demo. Tidak ada exception runtime, error console, atau request HTTP ke luar preview lokal dalam pemeriksaan tersebut. Pemeriksaan batas adapter menolak 11 operasi tanpa kontrak dengan nol request jaringan. Sintaks 41 file JavaScript valid, tidak ada komentar source, dan lockfile sinkron.

Ekspor tersebut hanya bundling JavaScript lokal tanpa kompilasi bytecode Hermes, bukan APK atau release build. Pemilihan/penghapusan foto lokal pada web, pilihan keparahan, dan layout sempit 360 × 800 juga berhasil diperiksa tanpa error browser. Pemeriksaan browser memakai preview web; izin perangkat, GPS/galeri native, provider peta, serta tampilan Android/iOS tetap perlu diperiksa di perangkat. Tidak ada pengujian integrasi API nyata atau klaim bahwa fitur backend sudah berjalan. Aset/warna/layout dibandingkan dengan v3 melalui preview; penanda demo dan kondisi akun pengunjung sengaja ditampilkan agar data/sesi tidak disalahartikan sebagai layanan nyata.

Instalasi npm masih mencatat 22 entri dependency berstatus moderate pada rantai tooling yang telah tercatat pada scaffold awal. Tidak ada pembaruan paksa SDK atau klaim temuan tersebut telah selesai.

Butir 4–6 sengaja ditunda: penanganan loading/error/empty dan kegagalan API menyeluruh, laporan pengujian formal/Jest/tabel integrasi, branding final, signing, EAS release, serta `Aplikasi_Release.apk`. Penanganan error dasar dan pencegahan submit ganda yang sudah ada tidak dianggap penyelesaian butir tersebut.
