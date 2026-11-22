import { useState } from 'react';
import { View } from 'react-native';
import { AppText, Badge, Button, Card, Chips, Feedback, Field, Header, Screen, SectionHeading, TextLink, layout } from '../components/ui';
import DataNotice from '../components/DataNotice';
import FacilitiesArtwork from '../components/FacilitiesArtwork';
import LiveMap from '../components/LiveMap';
import V3Icon from '../components/V3Icon';
import { useAppContext } from '../hooks/useAppContext';
import { isCoordinate } from '../utils/validation';
import { theme } from '../theme';

export default function HealthFacilitiesScreen({ navigation }) {
  const { facilities, demoEnabled, updateTrip } = useAppContext();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Semua');
  const [detailId, setDetailId] = useState(null);
  const [expandedMap, setExpandedMap] = useState(false);
  const [message, setMessage] = useState('');
  const filtered = facilities.filter(facility => (category === 'Semua' || facility.category === category) && `${facility.name} ${facility.address}`.toLowerCase().includes(query.trim().toLowerCase()));
  function choose(facility) {
    if (!isCoordinate(facility.location?.coordinate)) return setMessage('Koordinat fasilitas belum tersedia. Tujuan belum diubah.');
    updateTrip('destination', { label: facility.name, coordinate: facility.location.coordinate, source: demoEnabled ? 'demo' : 'health' });
    navigation.navigate('RekomendasiRute');
  }
  return <Screen>
    <Header title="Fasilitas Kesehatan" subtitle="Temukan faskes dari layanan mitra Health" trailing={<V3Icon name="buildingHeader" />} />
    <DataNotice />
    <Field accessibilityLabel="Cari fasilitas kesehatan" placeholder="Cari rumah sakit atau puskesmas…" icon="search" value={query} onChangeText={setQuery} />
    <Chips options={['Semua', 'Rumah sakit', 'Puskesmas', 'Klinik']} value={category} onChange={setCategory} />
    {demoEnabled && !expandedMap ? <FacilitiesArtwork facilities={filtered} onSelect={facility => setDetailId(facility.id)} /> : <LiveMap facilities={filtered} height={expandedMap ? 300 : 155} onSelectFacility={facility => setDetailId(facility.id)} />}
    <SectionHeading action={expandedMap ? 'Peta ringkas' : 'Lihat peta'} onAction={() => setExpandedMap(value => !value)}>Fasilitas Terdekat</SectionHeading>
    {!filtered.length && <AppText variant="caption" color={theme.colors.muted}>{demoEnabled ? 'Tidak ada fasilitas contoh yang cocok dengan pencarian.' : 'Integrasi Health blocked: kontrak belum tersedia. Pilih tujuan langsung di peta atau buka demo di Home.'}</AppText>}
    {filtered.map((facility, index) => <Card key={facility.id} style={{ borderLeftWidth: index === 0 ? 3 : 1, borderLeftColor: index === 0 ? theme.colors.yellow : theme.colors.border, padding: 14 }}>
      <View style={{ flexDirection: 'row', gap: 14 }}><View style={{ width: 43, height: 43, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: theme.colors.soft }}><V3Icon name="building" /></View>
        <View style={[layout.flex, { gap: 6 }]}><View style={layout.between}><AppText variant="label" style={{ flex: 1 }}>{facility.name}</AppText><Badge>{facility.category}</Badge></View><AppText variant="tiny" color={theme.colors.muted}>{facility.category} · {facility.address}</AppText><View style={layout.divider} /><View style={layout.between}><TextLink color={theme.colors.muted} onPress={() => setDetailId(detailId === facility.id ? null : facility.id)}>{detailId === facility.id ? 'Tutup detail' : 'Lihat detail'}</TextLink><Button title="Jadikan tujuan" small onPress={() => choose(facility)} /></View></View>
      </View>
      {detailId === facility.id && <AppText variant="caption" color={theme.colors.muted}>{facility.address}{!isCoordinate(facility.location?.coordinate) ? ' · Lokasi belum tersedia' : ''}{demoEnabled ? ' · Contoh UI, bukan data Health terverifikasi.' : ''}</AppText>}
    </Card>)}
    <Feedback message={message} />
  </Screen>;
}
