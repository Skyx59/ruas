# Kontrak REST API

Kontrak laporan di bawah bersifat **provisional** dan menunggu persetujuan kelompok. Base URL lokal lewat gateway adalah `http://127.0.0.1`. Target publik setelah deployment adalah `https://antislop.stei.fun`. Skema yang dihasilkan FastAPI tersedia di `/api/openapi.json` dan Swagger UI di `/api/docs`.

| Method | Path | Respons sukses |
| --- | --- | --- |
| GET | `/api/health` | `200` dengan `{"status":"ok"}` ketika penyimpanan laporan dapat dibaca |
| POST | `/api/road-reports` | `201` dengan objek laporan dan header `Location` |
| GET | `/api/road-reports?limit=20&offset=0` | `200` dengan `items`, `limit`, dan `offset`. Urutan terbaru lebih dulu. |
| GET | `/api/road-reports/{report_id}` | `200` dengan objek laporan menurut UUID v4 |

## Laporan kondisi jalan

`latitude` dan `longitude` wajib berupa angka JSON dalam derajat desimal, masing-masing di rentang −90 sampai 90 dan −180 sampai 180. `description` berisi 1–500 karakter setelah spasi di ujung dibuang. Field tambahan ditolak. Daftar menerima `limit` 1–100 (default 20) dan `offset` 0–2.147.483.647 (default 0).

```sh
curl -i http://127.0.0.1/api/road-reports \
  -H 'Content-Type: application/json' \
  --data '{"latitude":-6.89,"longitude":107.61,"description":"Genangan di tepi jalan"}'
```

Contoh respons `201 Created` dengan `Location: /api/road-reports/3f07a63b-9381-4863-bc91-9f8875717301`.

```json
{
  "latitude": -6.89,
  "longitude": 107.61,
  "description": "Genangan di tepi jalan",
  "id": "3f07a63b-9381-4863-bc91-9f8875717301",
  "created_at": "2026-11-23T09:30:00.123456Z"
}
```

Ambil detail melalui path pada `Location` atau panggil `curl -fsS 'http://127.0.0.1/api/road-reports?limit=5&offset=0'` untuk membaca halaman pertama. Jika belum ada laporan, respons daftar adalah `{"items":[],"limit":5,"offset":0}`.

## Kesalahan API

Core service mengembalikan `error.code` dan `error.message`. Kesalahan validasi menambahkan `error.issues`, dengan lokasi field dan pesan per masalah. Contoh respons untuk latitude 91 adalah HTTP `422`.

```json
{
  "error": {
    "code": "validation_error",
    "message": "Request validation failed.",
    "issues": [
      {"field": ["body", "latitude"], "message": "Input should be less than or equal to 90"}
    ]
  }
}
```

UUID yang valid tetapi belum tercatat menghasilkan `404 not_found`. Kegagalan akses baca pada health check menghasilkan `503 service_unavailable`. Kegagalan internal yang tak terduga menghasilkan `500 internal_error` dengan detail publik generik. Respons yang dibuat langsung oleh Nginx atau Cloudflare mengikuti format masing-masing.

Endpoint sementara membuka akses baca dan tulis tanpa login. Gunakan data demo untuk pengujian dan sepakati otorisasi, moderasi, retensi data, dan kebijakan publikasi sebelum membuka pengumpulan laporan masyarakat.

## Kontrak final

Simpan kontrak RUAS, StepSafe, dan Health secara terpisah setelah dikonfirmasi pemilik API. Cakup base URL per environment, versi, method/path, skema dan satuan, sistem koordinat, autentikasi, otorisasi, pagination, status/error, rate limit, timeout, serta kompatibilitas perubahan.

Untuk RUAS, petakan kontrak laporan dan verifikasi kondisi jalan, rekomendasi, lingkungan, dan identitas. Untuk StepSafe, sepakati Walkability Index, kondisi trotoar, dan aksesibilitas jalur pejalan kaki. Untuk Health, sepakati informasi fasilitas kesehatan sebagai tujuan perjalanan. Client mobile saat ini menyediakan transport HTTP umum dan menunggu kontrak final untuk method domain.
