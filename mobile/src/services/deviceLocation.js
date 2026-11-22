import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { isCoordinate } from '../utils/validation';

export async function describeLocation(coordinate) {
  if (!isCoordinate(coordinate) || Platform.OS === 'web') return 'Titik yang dipilih';
  let timer;
  try {
    const results = await Promise.race([
      Location.reverseGeocodeAsync(coordinate),
      new Promise(resolve => { timer = setTimeout(() => resolve([]), 3000); }),
    ]);
    const address = results[0];
    return address ? [...new Set([address.name, address.street, address.district, address.city].filter(Boolean))].join(', ') || 'Titik yang dipilih' : 'Titik yang dipilih';
  } catch { return 'Titik yang dipilih'; }
  finally { clearTimeout(timer); }
}

export async function getDeviceLocation() {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') throw new Error('Izin lokasi ditolak. Anda tetap dapat memilih lokasi dengan mengetuk peta.');
  if (!await Location.hasServicesEnabledAsync()) throw new Error('GPS perangkat belum aktif. Aktifkan GPS atau pilih lokasi di peta.');
  let timer;
  try {
    const position = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('GPS belum mendapat posisi. Pilih lokasi di peta atau coba lagi.')), 12000); }),
    ]);
    const coordinate = { latitude: position.coords.latitude, longitude: position.coords.longitude };
    if (!isCoordinate(coordinate)) throw new Error('Posisi GPS tidak valid. Pilih lokasi di peta.');
    const address = await describeLocation(coordinate);
    return { label: address === 'Titik yang dipilih' ? 'Lokasi saat ini' : address, coordinate, source: 'gps' };
  } finally { clearTimeout(timer); }
}
