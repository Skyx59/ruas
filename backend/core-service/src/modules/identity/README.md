# Identity and Access Management

Login memakai form OAuth2 password flow untuk demonstrasi RUAS dan menerbitkan access token Bearer JWT HS256 selama 30 menit. Server memeriksa signature serta klaim `sub`, `iat`, `exp`, `iss`, `aud`, dan `token_use`. Role dan status aktif dibaca dari SQLite setiap kali endpoint terlindungi dipanggil. Perubahan status atau role berlaku pada request berikutnya, termasuk untuk token yang sudah terbit.

## Membuat akun demo

Jalankan dari terminal interaktif. Password diisi dua kali tanpa echo dan panjangnya 12–128 karakter. Username peka huruf besar/kecil, unik, dan terbatas pada 3–64 huruf ASCII, angka, titik, underscore, atau tanda hubung. Pilih role melalui CLI dengan akses operator.

```sh
docker compose exec core-service python -m src.modules.identity.cli demo.user --role USER
docker compose exec core-service python -m src.modules.identity.cli demo.admin --role ADMIN
```

Untuk Python lokal, jalankan `.venv/bin/python -m src.modules.identity.cli demo.user --role USER` dari `backend/core-service/` dengan path SQLite dan environment yang sama dengan server. Pada STB tambahkan pilihan project dan file environment sesuai [runbook upgrade](../../../../../docs/deployment/README.md#upgrade-stb-existing-ke-authentication). API publik menyediakan login dan identitas akun saat ini. Pembuatan akun melalui CLI membutuhkan akses lingkungan backend.

## Pengelolaan autentikasi

- Argon2id menggunakan 19 MiB, dua iterasi, dan satu lane per hash. Hash tersimpan di tabel `users`. Respons identitas memuat ID, username, role, status aktif, serta waktu pembuatan.
- Kunci `RUAS_JWT_SECRET` wajib diisi menggunakan generator kriptografis, misalnya `secrets.token_hex(32)`. Menukar kunci membuat semua token sebelumnya tidak valid. Gunakan kunci berbeda untuk staging dan production.
- Satu worker membatasi login ke **20 percobaan per 60 detik** dan paling banyak **dua pemeriksaan password paralel**. Batas global terbagi di antara semua pemanggil endpoint login dan direset saat worker direstart. Jika penuh, API mengembalikan `429` dengan `Retry-After`. Header IP dari klien tidak menentukan jatah login.
- Password salah, username tak dikenal, dan akun nonaktif menghasilkan pesan `401` yang sama. Hash pengganti dipakai untuk memproses login username yang tak dikenal. Hak verifikasi berasal dari role SQLite. Role dalam payload atau header klien tidak memberi izin.
- Password flow dipakai oleh Swagger RUAS untuk akun demo pihak pertama. Kontrak identitas untuk mobile, refresh token, kebijakan provisioning/deaktivasi, dan batas akses publik masih memerlukan keputusan kelompok.

Contoh login, tabel RBAC, dan cara mencoba Swagger tersedia di [Kontrak API](../../../../../docs/api/README.md). [Dokumentasi OAuth2 JWT FastAPI](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/).
