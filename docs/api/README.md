# Kontrak REST API

API ini bersifat **provisional**. Base URL lokal melalui Nginx adalah `http://127.0.0.1`. Target STB setelah upgrade adalah `https://antislop.stei.fun`. Swagger UI tersedia pada `/api/docs` dan skema pada `/api/openapi.json`.

| Method dan path | Anonim | USER | ADMIN | Respons sukses |
| --- | --- | --- | --- | --- |
| GET `/api/health` | Ya | Ya | Ya | `200` dan `{"status":"ok"}` |
| POST `/api/auth/token` | Ya | Ya | Ya | `200` dan access token jika kredensial valid |
| GET `/api/auth/me` | `401` | Ya | Ya | `200` dan identitas akun aktif |
| GET `/api/road-reports` | Ya | Ya | Ya | `200` dengan `items`, `limit`, dan `offset` |
| GET `/api/road-reports/{report_id}` | Ya | Ya | Ya | `200` dengan detail laporan |
| POST `/api/road-reports` | `401` | Ya | Ya | `201` dan header `Location` |
| PATCH `/api/road-reports/{report_id}/verification` | `401` | `403` | Ya | `200` dan laporan dengan status terbaru |

Akses baca laporan secara publik dipertahankan sebagai kontrak sementara untuk data demo. Kelompok perlu menyetujui aturan moderasi, perubahan status, retensi, dan publikasi data sebelum mengumpulkan laporan masyarakat.

## Login dan penggunaan Bearer token

Kirim form `application/x-www-form-urlencoded` dengan `username`, `password`, dan `grant_type=password`. Respons memuat `access_token`, `token_type` bernilai `bearer`, dan `expires_in` bernilai `1800`. Kirim token dalam header `Authorization: Bearer <access_token>`. Endpoint `/api/auth/me` mengembalikan `id`, `username`, `role`, `is_active`, dan `created_at`.

Contoh login berikut membaca password secara interaktif. Gunakan HTTPS bila memakai domain publik.

```sh
BASE=http://127.0.0.1
TOKEN=$(
  python3 -c 'from getpass import getpass; from urllib.parse import urlencode; print(urlencode(dict(grant_type="password", username="demo.user", password=getpass("Password: "))), end="")' |
    curl -fsS "$BASE/api/auth/token" -H 'Content-Type: application/x-www-form-urlencoded' --data-binary @- |
    python3 -c 'import json, sys; print(json.load(sys.stdin)["access_token"])'
)
printf 'Authorization: Bearer %s\n' "$TOKEN" | curl -fsS -H @- "$BASE/api/auth/me"
```

JWT tidak berisi role. API membaca role dan status akun langsung dari database. Login dengan password salah, username tidak dikenal, atau akun nonaktif mengembalikan `401` dengan pesan yang sama. Saat limit login tercapai, tunggu sesuai header `Retry-After` pada respons `429`.

## Laporan kondisi jalan

`latitude` dan `longitude` wajib berupa angka JSON dalam derajat desimal, masing-masing di rentang −90 sampai 90 dan −180 sampai 180. `description` berisi 1–500 karakter setelah trimming. Field tambahan ditolak. Daftar memuat laporan terbaru lebih dahulu dengan `limit` 1–100 (default 20) dan `offset` 0–2.147.483.647 (default 0).

```sh
printf 'Authorization: Bearer %s\n' "$TOKEN" |
  curl -i -H @- "$BASE/api/road-reports" -H 'Content-Type: application/json' \
    --data '{"latitude":-6.89,"longitude":107.61,"description":"Genangan di tepi jalan"}'
unset TOKEN
```

Contoh respons `201` memiliki header `Location: /api/road-reports/3f07a63b-9381-4863-bc91-9f8875717301`.

```json
{
  "latitude": -6.89,
  "longitude": 107.61,
  "description": "Genangan di tepi jalan",
  "id": "3f07a63b-9381-4863-bc91-9f8875717301",
  "created_at": "2026-11-23T09:30:00.123456Z",
  "verification_status": "pending"
}
```

ADMIN dapat mengirim `{"verification_status":"verified"}` atau `{"verification_status":"rejected"}` ke endpoint PATCH. Laporan lama dan laporan baru berawal dari `pending`. Status terlihat pada respons detail maupun daftar, termasuk ketika dibaca tanpa login. Perubahan antarstatus final saat ini diizinkan sesuai kontrak sementara.

## Demonstrasi lewat Swagger UI

1. Buka `/api/docs`. Jalankan `GET /api/auth/me` tanpa login dan periksa `401`.
2. Klik **Authorize** dan isi username serta password akun USER pada skema **RuasOAuth2**. Biarkan client ID dan secret kosong, lalu klik **Authorize** dan **Close**.
3. Jalankan `GET /api/auth/me` dan periksa `200` dengan role USER. Buat laporan demo dan salin UUID hasil `201`. Kirim PATCH verifikasi untuk UUID yang sama dan periksa `403`.
4. Buka **Authorize**, klik **Logout**, lalu login sebagai ADMIN. Ulangi PATCH dengan UUID laporan demo dan periksa `200`. GET detail turut menampilkan status terbaru.

## Kesalahan API

Core service mengembalikan `error.code` dan `error.message`. Kesalahan validasi menambahkan `error.issues` berisi lokasi dan pesan field. Token yang absen, rusak atau kedaluwarsa menghasilkan `401` dan `WWW-Authenticate: Bearer`. Role aktif tanpa izin menghasilkan `403`. UUID valid yang belum tercatat menghasilkan `404` pada endpoint yang diizinkan. Kegagalan baca health menghasilkan `503`; kegagalan internal tak terduga menghasilkan `500` dengan pesan generik. Respons yang dibuat langsung oleh Nginx atau Cloudflare mengikuti format masing-masing.

## Kontrak final dan integrasi

Kontrak RUAS, StepSafe, dan Health ditetapkan bersama pemilik masing-masing API. Cakup base URL, versi, skema, koordinat, autentikasi, otorisasi, pagination, error, rate limit, timeout, dan kompatibilitas. Client mobile saat ini menyediakan transport HTTP umum. Integrasi Walkability Index, tujuan fasilitas kesehatan, rekomendasi, dan data lingkungan menunggu kontrak yang sesuai.
