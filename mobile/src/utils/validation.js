export const incidentTypes = ['Banjir', 'Kemacetan', 'Hambatan'];
export const severityLevels = ['Ringan', 'Sedang', 'Berat'];

export function isCoordinate(value) {
  return Boolean(value && Number.isFinite(value.latitude) && Number.isFinite(value.longitude) && Math.abs(value.latitude) <= 90 && Math.abs(value.longitude) <= 180);
}

export function parseCoordinate(latitude, longitude) {
  if (!String(latitude).trim() || !String(longitude).trim()) return null;
  const value = { latitude: Number(String(latitude).replace(',', '.')), longitude: Number(String(longitude).replace(',', '.')) };
  return isCoordinate(value) ? value : null;
}

export function validateTrip(trip) {
  const errors = {};
  if (!trip.origin.label.trim()) errors.origin = 'Tentukan titik asal perjalanan.';
  if (!trip.destination.label.trim()) errors.destination = 'Tentukan tujuan perjalanan.';
  if (trip.origin.label.trim() && trip.origin.label.trim().toLowerCase() === trip.destination.label.trim().toLowerCase()) errors.destination = 'Tujuan harus berbeda dengan titik asal.';
  return errors;
}

export function validateReport(draft) {
  const errors = {};
  if (!isCoordinate(draft.location?.coordinate)) errors.location = 'Pilih titik kejadian di peta atau gunakan GPS.';
  if (!incidentTypes.includes(draft.type)) errors.type = 'Pilih jenis kejadian.';
  if (!severityLevels.includes(draft.severity)) errors.severity = 'Pilih tingkat keparahan.';
  if (!draft.description.trim()) errors.description = 'Jelaskan kondisi jalan yang Anda temukan.';
  else if (draft.description.trim().length > 300) errors.description = 'Deskripsi maksimal 300 karakter.';
  return errors;
}

export function validateCredentials(values, registration = false) {
  const errors = {};
  if (registration && !values.name?.trim()) errors.name = 'Nama lengkap wajib diisi.';
  if (!values.email.trim()) errors.email = 'Email wajib diisi.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'Masukkan alamat email yang valid.';
  if (!values.password) errors.password = 'Password wajib diisi.';
  else if (registration && values.password.length < 8) errors.password = 'Password minimal 8 karakter.';
  if (registration && values.confirmPassword !== values.password) errors.confirmPassword = 'Konfirmasi password harus sama.';
  return errors;
}
