# DDD RUAS

Road Condition Management sudah menyediakan alur buat, daftar, dan baca laporan dengan kontrak sementara. Model domain rinci, verifikasi laporan, dan tiga konteks lain menunggu keputusan kelompok.

| Bounded context | Cakupan |
| --- | --- |
| Road Condition Management | Laporan masyarakat, pengelompokan, verifikasi kondisi ruas jalan |
| Route Recommendation | Evaluasi risiko banjir, kemacetan, cuaca, waktu tempuh, jarak, kondisi jalan; peringkat alternatif rute berbasis aturan |
| Environmental Data Integration | Penerimaan dan normalisasi data cuaca serta banjir untuk RUAS |
| Identity and Access Management | Identitas, autentikasi, dan otorisasi pengguna RUAS |

Keempat konteks merupakan modul internal satu core service. StepSafe dan Health berada di luar batas RUAS, memiliki backend serta data masing-masing, dan terhubung melalui kontrak REST. Tidak ada database bersama atau penggabungan source code.

Artefak berikutnya: ubiquitous language, context map, aggregate dan invariant, use case, kebijakan akses antarmodul, serta aturan dan versi pembobotan risiko. Nilai bobot, ambang, sumber data, dan penanganan data kedaluwarsa harus disepakati sebelum implementasi.
