# Gateway RUAS

Status: scaffold. Direktori ini disediakan untuk konfigurasi Nginx setelah alamat upstream, port core service, batas ukuran request, timeout, dan kebijakan header ditentukan.

Alur yang direncanakan: mobile → HTTPS Cloudflare → Cloudflare Tunnel → Nginx → satu RUAS core service. Konfigurasi ingress tunnel dan origin harus disepakati bersama konfigurasi gateway. Token atau berkas kredensial Cloudflare disediakan saat runtime di luar Git.

Konfigurasi Nginx, Cloudflare Tunnel, Dockerfile, Compose, dan instruksi menjalankan gateway: **belum tersedia**. Tidak ada konfigurasi atau perubahan jaringan pada STB yang dilakukan oleh scaffold ini.
