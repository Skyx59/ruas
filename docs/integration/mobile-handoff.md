# Handoff mobile Person B — PWAM butir 1–3

## Sumber dan perbedaan integrasi

Pada 23 November 2026, implementasi mobile mengacu pada slide 22 spesifikasi lokal `1794269199736_1_Tugas-Besar-TST-PWAM-1.pdf`, DDD lokal `Konteks_Tubes 1 Merancang Layanan Inti Dengan DDD .pdf` bagian A–C, serta sembilan layar [Figma v3](https://www.figma.com/design/OuhT7b8hjin2ERRz6mVqwy?node-id=17-211).

DDD bagian B masih menyebut Health & Wellbeing dan Tourism & Culture Exchange sebagai asumsi awal. Instruksi mobile terbaru memakai StepSafe dan Health. Person A dan kelompok mitra perlu menyinkronkan keputusan ini pada dokumen domain serta kesepakatan integrasi. Mobile tidak mengubah DDD atau menyatakan kerja sama tersebut sudah final/aktif.

Keempat bounded context internal tetap berada di satu core service. Integrasi lintas kelompok ditempatkan pada mobile atau layanan di luar STB. Mobile hanya mengolah pilihan pengguna dan presentasi hasil, tidak mengimplementasikan perhitungan risiko, verifikasi domain, atau Walkability Index.

## Yang diperlukan untuk mengaktifkan adapter

| Pemilik | Kontrak yang diperlukan |
| --- | --- |
| Person A / RUAS | Base URL resmi; daftar endpoint dan method; input perjalanan/laporan; koordinat dan satuan; enum kejadian, keparahan dan status; payload/hasil autentikasi; masa berlaku dan refresh sesi; otorisasi laporan/konfirmasi; upload foto; daftar/detail laporan; riwayat dan statistik kontribusi; hasil evaluasi rute dan cuaca |
| Kelompok StepSafe | Pemilik API dan base URL; input rute atau koordinat; format dan makna Walkability Index, kondisi trotoar serta aksesibilitas; satuan/cakupan; mekanisme akses |
| Kelompok Health | Identitas kelompok penyedia dan base URL; pencarian/kategori; data fasilitas dan koordinat; format detail serta mekanisme akses |

Sumber kontrak yang dapat diterima: OpenAPI, Postman, atau implementasi backend yang disepakati. Repository saat ini tidak memiliki kontrak aktual untuk ketiga penyedia. Karena itu tidak ada endpoint yang terhubung dan tidak ada integrasi nyata yang diklaim berhasil.

`mobile/src/services/serviceAdapters.js` menyediakan tempat adapter terpisah. `ApiService.js` hanya memanggil operasi adapter yang terdaftar; operasi tanpa adapter melempar `CONTRACT_UNAVAILABLE` sebelum jaringan. Nama operasi dan model tampilan di [README mobile](../../mobile/README.md) adalah antarmuka internal UI, bukan skema REST yang ditetapkan sepihak.

Base URL berada di environment publik mobile. API key privat tidak boleh disematkan ke bundle. Bila kredensial privat diperlukan untuk API mitra, Person A perlu menentukan akses server-side yang aman di luar STB. Tidak ada layanan integrasi baru atau konfigurasi server yang dibuat pada tahap ini.

## Batas hasil implementasi

- Butir 1: source mobile dan README tersedia di monorepo lokal; publikasi perubahan dilakukan oleh pengguna.
- Butir 2: sembilan layar, Stack + Tab, state bersama, input/chip, lokasi, pilihan fasilitas/rute, serta validasi tersedia. Autentikasi dan mutasi nyata menunggu kontrak RUAS sehingga butir ini masih parsial.
- Butir 3: ApiService dan tiga adapter/interface tersedia, tetapi request/respons nyata ketiga penyedia terblokir kontrak sehingga integrasi belum selesai.
- Data demo terpisah dan diberi label; tidak menjadi fallback integrasi. Demo tidak membuat sesi, mengirim foto/laporan, atau mengonfirmasi kejadian nyata.
- Butir 4–6, build release, APK, video, PDF testing, deployment, backend, dan perubahan STB tidak dikerjakan pada tahap ini.
