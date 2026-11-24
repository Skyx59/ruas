# Kontrak REST API

API v0.3.0 ini bersifat **provisional**. STB belum up menurut pengguna pada 24 November 2026; endpoint yang dideskripsikan tersedia pada implementasi lokal, bukan klaim layanan publik sedang aktif. Base URL lokal melalui Nginx adalah `http://127.0.0.1`. Target STB setelah upgrade adalah `https://antislop.stei.fun`. Swagger UI tersedia pada `/api/docs` dan skema pada `/api/openapi.json`.

| Method dan path | Anonim | USER | ADMIN | Respons sukses |
| --- | --- | --- | --- | --- |
| GET `/api/health` | Ya | Ya | Ya | `200` dan `{"status":"ok"}` |
| POST `/api/auth/token` | Ya | Ya | Ya | `200` dan access token jika kredensial valid |
| GET `/api/auth/me` | `401` | Ya | Ya | `200` dan identitas akun aktif |
| GET `/api/auth/me/profile` | `401` | Ya | Ya | `200` dan identitas/statistik milik sendiri |
| GET `/api/road-reports/mine` | `401` | Ya | Ya | `200` dan riwayat milik sendiri |
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

`latitude` dan `longitude` wajib berupa angka JSON dalam derajat desimal, masing-masing di rentang −90 sampai 90 dan −180 sampai 180. `description` berisi 1–500 karakter setelah trimming. Field tambahan di luar kontrak ditolak, termasuk `owner_id`, `role`, dan `verification_status` pada pembuatan laporan. Daftar memuat laporan terbaru lebih dahulu dengan `limit` 1–100 (default 20) dan `offset` 0–2.147.483.647 (default 0).

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

ADMIN yang bukan pelapor dapat mengirim `{"verification_status":"verified"}` atau `{"verification_status":"rejected"}` ke endpoint PATCH. Laporan lama dan laporan baru berawal dari `pending`. Status terlihat pada respons detail maupun daftar, termasuk ketika dibaca tanpa login. Perubahan antarstatus final saat ini diizinkan sesuai kontrak sementara.

## Demonstrasi lewat Swagger UI

1. Buka `/api/docs`. Jalankan `GET /api/auth/me` tanpa login dan periksa `401`.
2. Klik **Authorize** dan isi username serta password akun USER pada skema **RuasOAuth2**. Biarkan client ID dan secret kosong, lalu klik **Authorize** dan **Close**.
3. Jalankan `GET /api/auth/me` dan periksa `200` dengan role USER. Buat laporan demo dan salin UUID hasil `201`. Kirim PATCH verifikasi untuk UUID yang sama dan periksa `403`.
4. Buka **Authorize**, klik **Logout**, lalu login sebagai ADMIN. Ulangi PATCH dengan UUID laporan demo dan periksa `200`. GET detail turut menampilkan status terbaru.

## Kesalahan API

Core service mengembalikan `error.code` dan `error.message`. Kesalahan validasi menambahkan `error.issues` berisi lokasi dan pesan field. Token yang absen, rusak atau kedaluwarsa menghasilkan `401` dan `WWW-Authenticate: Bearer`. Role aktif tanpa izin menghasilkan `403`. UUID valid yang belum tercatat menghasilkan `404` pada endpoint yang diizinkan. Kegagalan baca health menghasilkan `503`; kegagalan internal tak terduga menghasilkan `500` dengan pesan generik. Respons yang dibuat langsung oleh Nginx atau Cloudflare mengikuti format masing-masing.

## Kontrak final dan integrasi

Kontrak RUAS, StepSafe, dan Health ditetapkan bersama pemilik masing-masing API. Cakup base URL, versi, skema, koordinat, autentikasi, otorisasi, pagination, error, rate limit, timeout, dan kompatibilitas. Integrasi Walkability Index, tujuan fasilitas kesehatan, rekomendasi, dan data lingkungan menunggu kontrak yang sesuai.

## Status adapter mobile

Client mobile menyediakan transport HTTP umum yang mengembalikan `Response`. `ApiService.js` dan `serviceAdapters.js` memisahkan operasi UI dari detail kontrak HTTP. Adapter RUAS sudah memetakan login, profil, riwayat privat, buat/baca laporan, dan verifikasi ke endpoint yang didokumentasikan di atas. Dokumentasi StepSafe sudah diberikan tetapi belum dapat dibaca saat pemeriksaan; Health ditunda sesuai instruksi pengguna. Tidak ada endpoint mitra yang ditebak. Operasi tanpa adapter ditolak sebelum jaringan. Data contoh berlabel untuk preview UI berada terpisah dan tidak menjadi respons API atau fallback otomatis. Lihat [README mobile](../../mobile/README.md) untuk antarmuka internal tampilan dan [handoff](../integration/mobile-handoff.md) untuk kebutuhan pemilik layanan.

## Metadata laporan dan kepemilikan v0.3.0

Field tambahan yang diterima pada POST dan dikembalikan pada respons:

| Field | Nilai | Aturan |
| --- | --- | --- |
| `incident_type` | `flood`, `traffic`, `obstacle`, atau `null` | Jenis kejadian; opsional demi kompatibilitas klien lama |
| `severity` | `low`, `medium`, `high`, atau `null` | Keparahan klaim pelapor; bukan hasil evaluasi risiko otomatis |
| `location_label` | String 1–200 karakter setelah trimming, atau `null` | Nama/label titik, bukan bukti hasil geocoding yang terverifikasi |

```json
{
  "latitude": -6.89,
  "longitude": 107.61,
  "description": "Genangan pada sebagian badan jalan",
  "incident_type": "flood",
  "severity": "medium",
  "location_label": "Titik yang dipilih"
}
```

Pemilik ditetapkan server dari token aktif dan disimpan di database. `owner_id` tidak diterima dari client maupun dibuka pada response publik. Endpoint `/api/road-reports/mine` memakai `limit` dan `offset` yang sama dengan daftar publik, tetapi selalu memfilter berdasarkan akun login. Mengirim ID akun lain pada query tidak mengalihkan kepemilikan hasil.

`GET /api/auth/me/profile` memuat `account` dengan skema identitas `/api/auth/me`, serta `statistics`:

```json
{
  "reports": 2,
  "verified": 1,
  "confirmations": null
}
```

Angka `reports` dan `verified` dihitung dari database untuk akun tersebut. `verified` berarti laporan milik akun yang saat ini berstatus verified, bukan total historis semua tindakan moderasi. `confirmations` masih `null` karena fitur konfirmasi warga belum diimplementasikan; jangan mengartikannya sebagai nol.

Semua laporan baru berstatus `pending`. ADMIN memperoleh `403` jika mencoba memverifikasi atau menolak laporan miliknya sendiri. Laporan lama yang pemiliknya tidak tercatat tidak diasosiasikan ke akun secara otomatis. Pemeriksaan keaslian kejadian, TTL, deduplikasi, serta rate limit pembuatan laporan masih merupakan usulan pada [evaluasi domain](../ddd/reporting-and-routing.md).

## Migrasi dan batas implementasi

Startup menambah kolom nullable serta indeks kepemilikan secara aditif. ID, koordinat, deskripsi, waktu, dan status data lama dipertahankan. Metadata kosong tidak diisi dengan tebakan. Backup tetap wajib sebelum operator menerapkan upgrade pada data penting. Tidak ada migrasi/deployment pada STB yang dijalankan dalam revisi ini.

Endpoint registrasi, rekomendasi rute, cuaca, upload foto, revokasi/refresh token, serta konfirmasi warga belum tersedia. Lihat [status StepSafe](../integration/stepsafe.md); domain dokumentasi yang diketahui tidak berarti kontrak HTTP sudah terbaca.
