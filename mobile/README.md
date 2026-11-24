# RUAS mobile

React Native Expo SDK 58 berbasis JavaScript. UI dan aset tetap mengacu pada [Figma RUAS v3](https://www.figma.com/design/OuhT7b8hjin2ERRz6mVqwy?node-id=17-211). Revisi 24 November 2026 memperbaiki kontrak/data, bukan merancang ulang antarmuka.

## Menjalankan

Gunakan Node.js sesuai `engines` pada `package.json`, npm, dan Expo Go yang kompatibel dengan SDK 58.

```powershell
cd mobile
npm ci
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npx expo start --clear
```

File lokal berada di `mobile/.env`. Jangan menimpa environment yang sudah ada. Untuk perangkat fisik, base URL RUAS harus dapat diakses dari ponsel; `localhost` pada ponsel menunjuk ponsel itu sendiri.

```text
EXPO_PUBLIC_RUAS_API_BASE_URL=
EXPO_PUBLIC_STEPSAFE_API_BASE_URL=https://stepsafe.stei.fun
EXPO_PUBLIC_HEALTH_API_BASE_URL=
EXPO_PUBLIC_ENABLE_DEMO=false
```

RUAS memakai origin tanpa akhiran `/api`; adapter menambahkan path `/api/...`. Origin StepSafe berasal dari URL dokumentasi yang diberikan pengguna, bukan bukti bahwa suatu endpoint sudah terhubung. Semua `EXPO_PUBLIC_*` dapat dibaca dalam bundle; jangan menyimpan API key privat, password, atau token server di sana.

STB belum up menurut pengguna. Backend lokal dapat dipakai untuk pengembangan; konfigurasi dan provisioning akun dijelaskan di [README core service](../backend/core-service/README.md). Tidak ada username/password demo bawaan. Akun uji harus dibuat operator melalui CLI dan diberikan kepada penilai melalui kanal yang sesuai; aplikasi tidak memalsukan login.

## Navigasi dan fitur

Bottom Tab berisi Home, Peta, Lapor, Faskes, Profil. Root Stack berisi MainTabs, RekomendasiRute, DetailLaporan, Login, Registrasi, serta modal PilihLokasi yang memakai MapScreen yang sama. Konfirmasi modal menyimpan koordinat internal dan kembali ke layar asal; batal/back tidak mengganti pilihan. State asal/tujuan, rute, dan sesi dikelola oleh AppContext.

| Bagian | Status aktual |
| --- | --- |
| Home/Peta | Laporan nyata RUAS; cuaca dan rute nyata masih blocked |
| Pemilihan lokasi | GPS, satu ketukan peta, marker, konfirmasi; koordinat tidak perlu diketik |
| Reverse geocoding | Memakai kemampuan perangkat jika tersedia; fallback `Titik yang dipilih` |
| Lapor | Lokasi, jenis, keparahan, deskripsi melalui API; foto hanya preview, upload blocked |
| Detail laporan | Status dan metadata API; verifikasi/penolakan oleh ADMIN selain pelapor |
| Profil | Identitas, riwayat privat, jumlah laporan dan jumlah terverifikasi dari server |
| Login | Username dan password ke OAuth2 Bearer JWT RUAS |
| Logout | Menghapus sesi dalam memori; backend belum menyediakan revokasi/refresh token |
| Registrasi | Form/validasi tersedia; endpoint belum tersedia, tidak membuat akun palsu |
| Rekomendasi | Pilihan moda dan presentasi alternatif tersedia; endpoint RUAS belum tersedia |
| StepSafe | Interface tersedia; kontrak belum terbaca karena dokumentasi saat diperiksa membalas 530/1033 |
| Health/Faskes | Ditunda atas instruksi pengguna; UI yang ada dipertahankan |

Pencarian pada Peta memfilter laporan yang sudah dimuat; itu bukan geocoding alamat. Tidak ada hasil pencarian lokasi atau durasi perjalanan rekaan. Peta interaktif/tap tersedia pada Android/iOS; preview web menjelaskan keterbatasannya. GPS, galeri, keyboard, dan peta native tetap perlu diuji langsung di Expo Go pada perangkat.

## Kontrak API mobile

`ApiService.js` memakai client terpisah untuk RUAS, StepSafe, Health. Adapter RUAS memakai kontrak [backend v0.3.0](../docs/api/README.md):

- `POST /api/auth/token` dan `GET /api/auth/me` untuk login/identitas.
- `GET /api/auth/me/profile` untuk statistik kontribusi.
- `GET /api/road-reports` dan `GET /api/road-reports/{id}` untuk baca publik.
- `GET /api/road-reports/mine` untuk riwayat privat yang telah dibatasi server berdasarkan akun login.
- `POST /api/road-reports` untuk laporan, dengan pemetaan enum kejadian/keparahan.
- `PATCH /api/road-reports/{id}/verification` untuk ADMIN, dengan larangan verifikasi laporan sendiri.

Kategori API `flood/traffic/obstacle` dipetakan ke `Banjir/Kemacetan/Hambatan`; keparahan `low/medium/high` dipetakan ke `Ringan/Sedang/Berat`. Laporan lama yang tidak memiliki metadata tetap tidak diklasifikasikan; aplikasi tidak menebaknya dari deskripsi. `ownerId` hanya ditempel pada hasil endpoint privat milik akun saat ini atau hasil pembuatan laporan oleh akun tersebut; tidak ditebak dari daftar publik.

Daftar dibaca per halaman 100 item, dengan batas pemuatan 10.000 item per operasi. Riwayat lebih besar memerlukan desain pagination tersendiri yang belum mengubah UI saat ini. Kontribusi `confirmations` tetap `null`/ditampilkan `—`, sebab API konfirmasi warga belum ada. Sesi hanya berada dalam memori.

Transport memiliki timeout 15 detik dan pesan dasar untuk layanan tidak tersedia. Ini belum merupakan penyelesaian lengkap PWAM butir 4. StepSafe dan Health tetap tanpa endpoint adapter sampai kontrak aktual dapat diverifikasi; lihat [status StepSafe](../docs/integration/stepsafe.md). Token RUAS tidak diteruskan ke mitra.

## Preview demo

Home → Lihat demo menggunakan `src/preview/demoData.js` yang terpisah dari adapter. Semua contoh diberi label; kegagalan API tidak otomatis diganti demo. Contoh waktu/jarak/risiko hanya ilustrasi tetap Kampus ITB → RS Hasan Sadikin dengan kendaraan. Tidak ada perhitungan risiko atau Walkability Index di mobile. Demo tidak membuat sesi, mengirim laporan/foto, atau mengubah status laporan nyata.

## Batas dan tindak lanjut

PWAM butir 1–3 masih parsial sampai dua integrasi mitra dan layanan inti rute tersedia. Jest yang ada, pengujian backend, dan pemeriksaan browser tidak menggantikan laporan testing formal. EAS hanya berupa persiapan; belum ada APK/signing/package ID final.

[Masukan evaluasi: pelaporan, ETA, dan peta](../docs/ddd/reporting-and-routing.md) memisahkan implementasi yang sudah ada dari usulan. Pergantian penyedia peta dan perubahan tampilan harus dibahas dahulu; Faskes ditunda. Dua teks bantuan lama pada layar laporan/profil masih perlu persetujuan koreksi copy, tanpa perubahan layout.
