# Kontrak REST API

Status: belum disepakati. Belum ada endpoint, skema request/response, atau autentikasi yang dinyatakan berfungsi.

Simpan kontrak RUAS, StepSafe, dan Health secara terpisah setelah dikonfirmasi pemilik masing-masing API. Kontrak minimal mencakup base URL per environment, versi API, method/path, skema dan satuan data, sistem koordinat, autentikasi, otorisasi, pagination, status/error, rate limit, timeout, serta kompatibilitas perubahan.

Untuk RUAS, petakan kontrak ke laporan dan verifikasi kondisi jalan, rekomendasi rute, lingkungan, dan identitas. Untuk StepSafe, sepakati Walkability Index, kondisi trotoar, dan aksesibilitas jalur pejalan kaki. Untuk Health, sepakati informasi fasilitas kesehatan sebagai tujuan perjalanan.

Client mobile hanya menyediakan transport HTTP umum yang mengembalikan `Response`; parsing payload dan method domain menunggu kontrak final. Tidak ada pemanggilan API otomatis dari layar placeholder, data dummy, atau endpoint final yang diasumsikan.
