# Status kontrak StepSafe

Sumber dokumentasi dari pengguna: https://stepsafe.stei.fun/api/docs/ . Pada pemeriksaan 24 November 2026, URL ini mengembalikan HTTP 530 dengan Cloudflare Tunnel error 1033. Karena isi Swagger/OpenAPI tidak terbaca, method, path, request, response, dan mekanisme akses operasional belum bisa ditetapkan dari URL tersebut.

PDF lokal `StepSafe - DDD.pdf` menjelaskan domain indeks kelayakan berjalan 0–100 serta rencana autentikasi mitra `X-API-Key`. Itu merupakan informasi desain, bukan kontrak HTTP yang membuktikan endpoint dan field tertentu. Tidak ada endpoint final atau API key yang dibuat dari asumsi tersebut.

`EXPO_PUBLIC_STEPSAFE_API_BASE_URL` disiapkan dengan origin yang diberikan pengguna. `ApiService.stepSafe.getWalkability` tetap menolak operasi sebelum jaringan sampai adapter dapat ditulis berdasarkan skema aktual. Tidak ada skor demo dan tidak ada token RUAS yang dikirim ke StepSafe. Jika key mitra bersifat privat, jangan menaruhnya dalam environment publik mobile; tentukan akses melalui layanan integrasi di luar STB setelah kontraknya jelas.

Pemilik StepSafe perlu menyediakan ekspor OpenAPI/Postman atau memulihkan dokumentasi agar field berikut dapat diverifikasi:

- Endpoint/method Walkability Index dan data trotoar/aksesibilitas.
- Apakah input berupa titik+radius, bounding box, segmen, atau geometri rute; satuan dan urutan koordinat.
- Skema respons, nilai null, rentang/arti skor, timestamp dan cakupan area.
- Autentikasi, scope, rate limit, pagination, error dan masa berlaku data.

Indeks kawasan tidak boleh diberi label sebagai indeks rute tanpa aturan pemetaan segmen yang disepakati. Integrasi Health/Faskes ditunda dan tidak digantikan dengan hasil POI atau data palsu.
