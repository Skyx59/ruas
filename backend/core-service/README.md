# RUAS core service

Status: scaffold, belum dapat dijalankan. Bahasa, framework, database, port, autentikasi, dan kontrak HTTP belum ditentukan.

Seluruh bounded context berjalan dalam satu core microservice dan satu container aplikasi setelah stack dipilih. Direktori modul adalah batas internal kode, bukan service atau container terpisah.

| Direktori | Tanggung jawab |
| --- | --- |
| `src/modules/road-conditions/` | Laporan masyarakat, pengelompokan laporan, verifikasi kondisi jalan |
| `src/modules/route-recommendation/` | Evaluasi risiko berbasis aturan dan pemeringkatan alternatif rute |
| `src/modules/environment/` | Integrasi data cuaca dan banjir yang dibutuhkan domain RUAS |
| `src/modules/identity/` | Autentikasi dan otorisasi RUAS |
| `src/routes/` | Adapter dan registrasi route setelah kontrak API disepakati |
| `src/middleware/` | Concern lintas request sesuai framework terpilih |
| `src/config/` | Pembacaan dan validasi konfigurasi runtime |

Jaga akses antar modul melalui antarmuka yang eksplisit. Detail layer domain, application, dan infrastructure ditambahkan saat ada kebutuhan implementasi, tanpa membuat dependency framework sekarang.

`../.env.example` hanya daftar awal variabel; nilai kosong harus ditentukan saat implementasi. Tidak ada kredensial aktif atau koneksi database. Rahasia runtime tidak boleh dimasukkan ke image, Git, atau mobile.

STB Armbian nantinya hanya menjalankan core service, Nginx, Cloudflare Tunnel, dan komponen pendukung yang benar-benar diperlukan. Kompatibilitas arsitektur ARM dan kebutuhan resource harus diverifikasi setelah stack dipilih. Integrasi StepSafe dan Health ditempatkan di mobile atau layanan integrasi di luar STB.

Dockerfile, Compose, perintah start, migrasi, dan deployment: **belum tersedia**.
