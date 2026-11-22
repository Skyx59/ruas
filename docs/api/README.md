# Kontrak REST API

Status: belum disepakati. Belum ada endpoint, skema request/response, atau autentikasi yang dinyatakan berfungsi.

Simpan kontrak RUAS, StepSafe, dan Health secara terpisah setelah dikonfirmasi pemilik masing-masing API. Kontrak minimal mencakup base URL per environment, versi API, method/path, skema dan satuan data, sistem koordinat, autentikasi, otorisasi, pagination, status/error, rate limit, timeout, serta kompatibilitas perubahan.

Untuk RUAS, petakan kontrak ke laporan dan verifikasi kondisi jalan, rekomendasi rute, lingkungan, dan identitas. Untuk StepSafe, sepakati Walkability Index, kondisi trotoar, dan aksesibilitas jalur pejalan kaki. Untuk Health, sepakati informasi fasilitas kesehatan sebagai tujuan perjalanan.

Client mobile menyediakan transport HTTP umum yang mengembalikan `Response`. `ApiService.js` dan `serviceAdapters.js` memisahkan operasi UI dari detail kontrak HTTP. Semua adapter penyedia masih kosong; endpoint, method, autentikasi, serta parsing payload menunggu kontrak final. Operasi tanpa adapter ditolak sebelum jaringan. Data contoh berlabel untuk preview UI berada terpisah dan tidak menjadi respons API atau fallback otomatis. Lihat [README mobile](../../mobile/README.md) untuk antarmuka internal tampilan dan [handoff](../integration/mobile-handoff.md) untuk kebutuhan pemilik layanan.
