import * as Location from 'expo-location';

export async function getDeviceLocation() {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') throw new Error('Izin lokasi belum diberikan. Pilih koordinat kejadian secara manual.');
  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return {
    label: 'Lokasi saat ini',
    coordinate: { latitude: position.coords.latitude, longitude: position.coords.longitude },
    source: 'gps',
  };
}
