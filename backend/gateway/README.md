# Gateway RUAS

Nginx Alpine menerima HTTP pada port 80. Compose mengikat port host ke `127.0.0.1` untuk origin Cloudflare Tunnel yang sudah berjalan. TLS publik ditangani oleh Cloudflare. Request di bawah `/api/` diteruskan ke `core-service:8000` dengan path dan query utuh. Request ke root mendapat 404 dari gateway. DNS Docker memungkinkan Nginx menemukan alamat baru core service saat container dibuat ulang. [Dokumentasi Nginx untuk proxy](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_pass) dan [resolusi upstream](https://nginx.org/en/docs/http/ngx_http_upstream_module.html#resolve).

Gateway meneruskan `Host` yang diproses Nginx dan menulis ulang `X-Real-IP` serta `X-Forwarded-For` memakai alamat koneksi langsung. Untuk tunnel, alamat tersebut mewakili koneksi origin, sehingga identitas IP pengunjung masih memerlukan kebijakan tersendiri. `X-Forwarded-Proto` ditetapkan ke `https` untuk host publik `antislop.stei.fun` dan memakai skema koneksi Nginx untuk host lain. Nilai `Forwarded` dari klien dibuang. Uvicorn memakai metadata koneksi internal dan tidak mengandalkan header proxy untuk akses atau pengambilan keputusan.

Timeout koneksi upstream adalah 3 detik dan timeout kirim serta baca upstream 10 detik antaroperasi. Ukuran body dibatasi 16 KiB. Health check gateway menguji `/api/health` melalui Nginx sampai ke FastAPI dan SQLite.

Ikuti [runbook STB](../../docs/deployment/README.md) untuk staging dan cutover.
