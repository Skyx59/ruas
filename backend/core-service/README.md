# RUAS core service

Satu aplikasi FastAPI menjalankan modul internal RUAS. Road Condition Management memuat model Pydantic, router, dan repository SQLite. Startup menjalankan migrasi aditif SQLite dan membuat tabel serta indeks jika belum tersedia. Health check memeriksa tabel laporan dapat dibaca. Kesalahan API memakai satu format JSON dan log operasional ditulis ke keluaran proses.

| Direktori | Tanggung jawab |
| --- | --- |
| `src/modules/road_conditions/` | Buat, daftar, dan baca detail laporan kondisi jalan |
| `src/modules/route-recommendation/` | Struktur modul rekomendasi dan evaluasi risiko |
| `src/modules/environment/` | Struktur modul integrasi cuaca dan banjir |
| `src/modules/identity/` | Login, JWT, RBAC, pembatas login, dan CLI akun |
| `src/routes/` | Endpoint umum, termasuk health check |
| `src/middleware/` | Model error dan handler lintas request |
| `src/config/` | Pembacaan dan validasi konfigurasi runtime |
| `tests/` | Uji HTTP dalam proses dan SQLite temporer |

## Menjalankan langsung dengan Python

Dari root repository, gunakan Python 3.12.

```sh
cd backend/core-service
python3.12 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt
.venv/bin/python -m pytest -q
export RUAS_JWT_SECRET="$(.venv/bin/python -c 'import secrets; print(secrets.token_hex(32))')"
.venv/bin/python -m uvicorn src.main:create_app --factory --host 127.0.0.1 --port 8000 --workers 1 --no-proxy-headers
```

Dari terminal lain, panggil `curl -fsS http://127.0.0.1:8000/api/health`. Path Swagger UI adalah `/api/docs`. Uji pytest menggunakan database temporer yang terpisah dari database runtime.

## Konfigurasi

| Variabel | Default | Kegunaan |
| --- | --- | --- |
| `RUAS_DB_PATH` | `data/ruas.sqlite3` pada Python lokal, relatif ke direktori kerja. Image menetapkan `/app/data/ruas.sqlite3`. | File SQLite. Gunakan direktori yang dapat ditulis oleh proses aplikasi. |
| `RUAS_LOG_LEVEL` | `INFO` | Level log aplikasi `DEBUG`, `INFO`, `WARNING`, `ERROR`, atau `CRITICAL`. Access log HTTP dikelola Uvicorn. |
| `RUAS_JWT_SECRET` | Wajib | Kunci acak 32 byte dalam hex lowercase. Simpan di environment atau file env privat. |
| `RUAS_GATEWAY_PORT` | `80` | Port loopback host untuk gateway Compose. |

Compose membaca `RUAS_LOG_LEVEL`, `RUAS_JWT_SECRET`, dan `RUAS_GATEWAY_PORT` dari environment shell atau `backend/.env` ketika dijalankan dari `backend/`. Gunakan `backend/.env.example` sebagai acuan. Untuk Python langsung, ekspor variabel melalui shell. Volume Compose dipasang di `/app/data` dan image core service berjalan dengan UID/GID `10001:10001`. Image memasang dependency runtime dengan wheel, tanpa compiler atau dependency pengujian.

Contoh request, response, dan status HTTP tersedia di [Kontrak API](../../docs/api/README.md). Panduan CLI, limit login, dan model token tersedia di [Modul Identity](src/modules/identity/README.md). Rekomendasi, skor risiko, feed lingkungan, dan aturan moderasi final masih menunggu kontrak domain bersama.
