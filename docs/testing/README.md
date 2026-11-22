# Laporan testing

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

| Kebutuhan | Status scaffold |
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
