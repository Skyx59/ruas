# Tanggapan evaluasi pelaporan dan rekomendasi rute

Revisi 24 November 2026. Dokumen ini mempertahankan UI/Figma v3 dan tidak mengubah penyedia peta. Faskes ditunda karena informasi kelompok Health belum final.

## Yang sudah diterapkan

Laporan memuat jenis kejadian, keparahan, deskripsi, koordinat, dan label lokasi. Pemilik ditetapkan server dari token, bukan field request. Laporan baru selalu `pending`; pengguna tidak dapat menetapkan `verified` atau pemilik lain. Verifikasi/penolakan tetap hanya untuk ADMIN, dengan larangan memverifikasi laporan sendiri. Riwayat dan kontribusi akun dibaca lewat endpoint privat; identitas pemilik tidak diekspos melalui daftar laporan publik. Migrasi mempertahankan metadata kosong pada laporan lama.

Langkah ini mengurangi peluang pemalsuan identitas dan pengesahan sendiri, tetapi belum membuktikan kebenaran kejadian. Lokasi GPS juga bisa dipalsukan; validitas koordinat berbeda dari validitas laporan. Tidak ada klaim bahwa sistem sudah menuntaskan spam atau verifikasi komunitas.

## Usulan pengendalian laporan, belum diaktifkan

- Perlakukan laporan sebagai klaim sampai ada pemeriksaan atau konfirmasi independen. Pelapor tidak dapat menguatkan laporannya sendiri; satu akun tidak boleh memberi konfirmasi berulang untuk kejadian yang sama.
- Simpan tindakan moderasi beserta waktu, pemeriksa, dan alasan; sediakan penolakan dan mekanisme koreksi. Audit log belum diimplementasikan.
- Sediakan idempotency key untuk retry request agar timeout jaringan tidak menggandakan satu pengajuan. Mekanisme ini belum diimplementasikan.
- Terapkan rate limit per akun pada pembuatan laporan serta deteksi kemiripan lokasi, jenis, dan waktu. Ambang tidak dipilih sembarang dan perlu disepakati; pengelompokan tidak boleh menghilangkan kesaksian independen.
- Beri masa berlaku sesuai jenis kejadian dan lakukan pemeriksaan ulang. Genangan, kemacetan sementara, dan kerusakan permanen tidak perlu memiliki TTL yang sama. Parameter belum ditetapkan.
- Upload bukti dapat menambah konteks, tetapi bukan jaminan kebenaran. Dukungan penyimpanan/retensi foto memerlukan kontrak dan kebijakan tersendiri.

Konfirmasi warga, audit moderasi, TTL, rate limit laporan, dan deduplikasi belum dinyatakan tersedia. Kontrak API publik tetap provisional.

## Dasar estimasi waktu

Jangan menambahkan angka tetap, misalnya lima menit, untuk setiap titik hambatan. Mulai dari rute dan durasi dasar dari mesin routing. Petakan kejadian yang masih relevan ke segmen rute, arah, dan moda yang benar; kejadian dekat jalan belum tentu berada di jalur pengguna. Gabungkan laporan duplikat dari satu kejadian agar tidak dihitung berulang.

Usulan metode, belum diimplementasikan:

1. Gunakan durasi dasar per segmen dari penyedia routing, dengan sumber dan waktu data yang diketahui.
2. Untuk penutupan yang terverifikasi, hindari segmen dan minta rute ulang; jangan merepresentasikannya sebagai tambahan waktu tetap.
3. Untuk pengurangan kecepatan yang memiliki data kalibrasi, koreksi hanya bagian segmen yang terdampak: `delta_t = panjang_terdampak / kecepatan_efektif - panjang_terdampak / kecepatan_dasar`, dengan satuan konsisten. Jangan menjumlahkan penalti ganda atas segmen/kejadian yang sama.
4. Jika tingkat perlambatan belum diketahui, pertahankan ETA penyedia dan gunakan informasi kejadian sebagai indikator risiko/ketidakpastian. Jangan mengarang ETA yang tampak presisi.
5. Pisahkan biaya risiko untuk pemeringkatan dari estimasi waktu fisik. Hindari menghitung kemacetan dua kali bila penyedia sudah memasukkannya.
6. Kalibrasi dan evaluasi terhadap waktu tempuh observasi sebelum menjadikan besaran koreksi sebagai fitur operasional.

RUAS belum mempunyai endpoint rekomendasi/ETA nyata. Angka dalam mode demo adalah contoh desain dan tidak menjadi hasil perhitungan domain.

## Peta dasar dan mesin routing

Istilah “openroutemap” pada evaluasi perlu dipastikan maksudnya. OpenStreetMap menyediakan basis data geografis; openrouteservice menyediakan layanan directions/routing. Mengganti data/penyedia peta tidak otomatis menghitung risiko banjir atau dampak hambatan.

Sumber primer: [OpenStreetMap](https://wiki.openstreetmap.org/wiki/About_OpenStreetMap) dan [openrouteservice Directions](https://giscience.github.io/openrouteservice/api-reference/endpoints/directions/).

Saran: pertahankan komponen peta dan desain saat ini, evaluasi penyedia routing sebagai sumber geometri/jarak/durasi di lapisan layanan. Pilihan penyedia, kuota, lisensi/atribusi, credential, dan penempatan integrasi perlu diputuskan dahulu. Tidak ada layanan routing berat yang ditambahkan ke STB dan tidak ada API key privat yang ditanam dalam mobile.

## Copy yang perlu ditinjau sebelum diubah

Tidak ada layout, style, JSX layar, atau file Faskes yang diubah dalam revisi ini. Setelah kontrak v0.3.0 dipakai, dua teks bantuan lama menjadi tidak sesuai:

- Lapor: usulan mengganti keterangan bahwa jenis/keparahan belum didukung menjadi “Lokasi, jenis, keparahan, dan deskripsi disimpan; upload foto belum tersedia”.
- Profil saat belum login: usulan mengganti keterangan bahwa API belum mendukung kepemilikan/statistik menjadi “Masuk untuk melihat riwayat dan kontribusi akun”.

Usulan copy disampaikan dahulu sesuai batasan pengguna; perubahan pada file UI menunggu persetujuan tersendiri.
