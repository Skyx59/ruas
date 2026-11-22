# Aset RUAS High-Fidelity v3

Sumber: [Figma RUAS v3](https://www.figma.com/design/OuhT7b8hjin2ERRz6mVqwy?node-id=17-211). Aset diunduh melalui hasil design context dan export aset Figma. Tidak ada desain v4, ilustrasi AI, atau perubahan file Figma.

SVG mempertahankan isi dan ukuran root dari sumber. `src/components/V3Icon.js` mengimpor aset lokal melalui Metro SVG transformer; warna dan dimensi SVG tidak ditimpa saat pemanggilan.

Peta Home, Rekomendasi, dan Detail memakai export ilustrasi statis dari node `17:270`, `17:556`, dan `17:611` pada mode demo. Export map ini hanya ilustrasi terpisah, bukan screenshot layar aplikasi. Peta laporan (`17:317`) dan fasilitas (`17:446`) dirakit dari layer SVG sumber dengan penanda interaktif agar filter benar-benar menyembunyikan penanda yang tidak cocok. PNG referensi kedua map juga dipertahankan sebagai export sumber.

Label/nilai di UI tetap komponen native dan data dinamis. Peta layanan menggunakan komponen native; ilustrasi demo tidak digunakan sebagai peta navigasi aktual. Font Inter diperoleh dari paket `@expo-google-fonts/inter` dengan empat weight yang digunakan: 400, 500, 600, dan 700.
