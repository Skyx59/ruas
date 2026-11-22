export const demoTrip = {
  origin: { label: 'Kampus ITB', coordinate: { latitude: -6.8915, longitude: 107.6107 }, source: 'demo' },
  destination: { label: 'RS Hasan Sadikin', coordinate: { latitude: -6.8965, longitude: 107.5986 }, source: 'demo' },
};

export const demoWeather = { locationLabel: 'Bandung', temperatureLabel: '24°C', description: 'Berawan', updatedLabel: 'Contoh cuaca pada desain v3' };

export const demoReports = [
  { id: 'demo-report-1', type: 'Banjir', title: 'Genangan di Jl. Merdeka', location: { label: 'Jl. Merdeka, Bandung', coordinate: { latitude: -6.9121, longitude: 107.6109 } }, timeLabel: '12 menit lalu · contoh', severity: 'Sedang', status: 'pending', reporterLabel: 'Komunitas', description: 'Genangan menutupi sebagian badan jalan dan memperlambat kendaraan yang melintas.', previewMarker: 'flood' },
  { id: 'demo-report-2', type: 'Kemacetan', title: 'Kemacetan di Jl. Dago', location: { label: 'Jl. Dago, Bandung', coordinate: { latitude: -6.8986, longitude: 107.6136 } }, timeLabel: '8 menit lalu · contoh', severity: 'Berat', status: 'verified', reporterLabel: 'Komunitas', description: 'Antrean kendaraan pada ruas jalan. Ini merupakan data contoh untuk pratinjau antarmuka.', previewMarker: 'traffic' },
  { id: 'demo-report-3', type: 'Hambatan', title: 'Hambatan di Jl. Dipatiukur', location: { label: 'Jl. Dipatiukur, Bandung', coordinate: { latitude: -6.8935, longitude: 107.6167 } }, timeLabel: '20 menit lalu · contoh', severity: 'Ringan', status: 'pending', reporterLabel: 'Komunitas', description: 'Sebagian jalur terhalang. Data ini tidak menunjukkan kondisi jalan sebenarnya.', previewMarker: 'obstacle' },
  { id: 'demo-report-4', type: 'Banjir', title: 'Genangan sekitar Coblong', location: { label: 'Coblong, Bandung', coordinate: { latitude: -6.8872, longitude: 107.6192 } }, timeLabel: '5 menit lalu · contoh', severity: 'Ringan', status: 'pending', reporterLabel: 'Komunitas', description: 'Contoh laporan genangan untuk interaksi penanda peta.', previewMarker: 'other' },
];

export const demoFacilities = [
  { id: 'demo-facility-1', name: 'RS Hasan Sadikin', category: 'Rumah sakit', address: 'Bandung', location: demoTrip.destination },
  { id: 'demo-facility-2', name: 'Puskesmas Dago', category: 'Puskesmas', address: 'Coblong', location: { label: 'Puskesmas Dago', coordinate: { latitude: -6.8855, longitude: 107.6165 }, source: 'demo' } },
  { id: 'demo-facility-3', name: 'Klinik Pratama', category: 'Klinik', address: 'Bandung', location: { label: 'Klinik Pratama', coordinate: { latitude: -6.901, longitude: 107.612 }, source: 'demo' } },
];

export const demoRoutes = [
  { id: 'demo-route-a', name: 'Rute A', durationLabel: '18 mnt', distanceLabel: '4,2 km', riskLabel: 'Risiko lebih rendah', riskTone: 'success', recommended: true, explanation: 'Contoh tampilan hasil evaluasi RUAS pada desain v3.', viaLabel: 'Lewat Jl. Dago', source: 'demo' },
  { id: 'demo-route-b', name: 'Rute B', durationLabel: '15 mnt', distanceLabel: '3,8 km', riskLabel: 'Risiko sedang', riskTone: 'warning', recommended: false, explanation: 'Contoh alternatif, bukan hasil perhitungan risiko.', source: 'demo' },
];
