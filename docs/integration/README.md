# Kesepakatan integrasi antarkelompok

RUAS, StepSafe, dan Health adalah aplikasi independen. Integrasi dilakukan melalui REST API dengan backend, database, dan source code masing-masing.

| Penyedia | Informasi yang dibutuhkan | Status |
| --- | --- | --- |
| RUAS | Kondisi jalan, evaluasi risiko, rekomendasi rute, identitas pengguna RUAS | Endpoint awal laporan tersedia secara provisional dan kontrak final belum disepakati |
| StepSafe | Walkability Index, kondisi trotoar, aksesibilitas jalur pejalan kaki | Kontrak belum disepakati |
| Health | Informasi fasilitas kesehatan sebagai tujuan perjalanan | Kelompok penyedia dan kontrak belum dikonfirmasi |

Integrasi antarkelompok berada di mobile atau layanan integrasi di luar STB. Tidak ada layanan agregasi antarkelompok di STB. Integrasi cuaca dan banjir internal RUAS tetap termasuk Environmental Data Integration.

Tentukan pemilik API, base URL publik, versi kontrak, skema data, autentikasi, kebijakan token, batas penggunaan, waktu berlaku data, serta perilaku saat penyedia gagal atau tidak tersedia. Jangan menganggap identitas/token RUAS otomatis berlaku pada StepSafe atau Health.

Base URL mobile disediakan melalui tiga variabel `EXPO_PUBLIC_*_API_BASE_URL` pada `mobile/.env.example`. Variabel tersebut masuk ke bundle aplikasi sehingga tidak boleh menyimpan rahasia. Jika penyedia mengharuskan API key rahasia, aksesnya harus melalui layanan yang aman di luar STB; jangan menanam key di aplikasi.

Integrasi nyata dan pengujian lintas kelompok belum tersedia. Tidak ada mock integrasi sebagai pengganti API penyedia.
