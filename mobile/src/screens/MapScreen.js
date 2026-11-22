import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { AppText, Button, Card, Chips, Feedback, Field, Header, Screen, TextLink, layout } from '../components/ui';
import V3Icon from '../components/V3Icon';
import DataNotice from '../components/DataNotice';
import MapArtwork from '../components/MapArtwork';
import LiveMap from '../components/LiveMap';
import ReportSummary from '../components/ReportSummary';
import { useAppContext } from '../hooks/useAppContext';
import { useAction } from '../hooks/useAction';
import { getDeviceLocation } from '../services/deviceLocation';
import { parseCoordinate } from '../utils/validation';
import { theme } from '../theme';

export default function MapScreen({ navigation }) {
  const { reports, demoEnabled, mapSelection, setMapSelection, setReportLocation, updateTrip } = useAppContext();
  const [filter, setFilter] = useState('Semua');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [point, setPoint] = useState(null);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [manual, setManual] = useState(false);
  const action = useAction();
  const filtered = useMemo(() => reports.filter(report => (filter === 'Semua' || report.type === (filter === 'Macet' ? 'Kemacetan' : filter)) && `${report.title} ${report.location.label}`.toLowerCase().includes(query.trim().toLowerCase())), [reports, filter, query]);
  const selected = filtered.find(report => report.id === selectedId) || filtered[0];
  useEffect(() => { setPoint(null); setLatitude(''); setLongitude(''); action.setMessage(''); }, [mapSelection]);
  function pick(next) {
    setPoint(next);
    setLatitude(String(next.coordinate.latitude));
    setLongitude(String(next.coordinate.longitude));
    action.setMessage('');
  }
  function usePoint() {
    const coordinate = parseCoordinate(latitude, longitude);
    if (!coordinate) return action.setMessage('Isi latitude −90 sampai 90 dan longitude −180 sampai 180.');
    const next = { label: point?.label || 'Titik koordinat pilihan', coordinate, source: point?.source || 'manual' };
    if (mapSelection === 'report') setReportLocation(next);
    else updateTrip(mapSelection, next);
    const target = mapSelection === 'report' ? 'ReportForm' : 'Home';
    setMapSelection(null);
    navigation.navigate(target);
  }
  return <Screen>
    <Header title="Peta Kondisi Jalan" subtitle="Pantau laporan, filter kejadian, temukan rute" />
    <DataNotice />
    {mapSelection ? <Card>
      <AppText variant="heading">{mapSelection === 'report' ? 'Lokasi kejadian' : mapSelection === 'origin' ? 'Titik asal perjalanan' : 'Tujuan perjalanan'}</AppText>
      <AppText variant="caption" color={theme.colors.muted}>Ketuk peta, gunakan GPS, atau masukkan koordinat.</AppText>
      <View style={layout.row}><Field label="Latitude" value={latitude} onChangeText={value => { setLatitude(value); setPoint(null); }} keyboardType="numbers-and-punctuation" style={layout.flex} /><Field label="Longitude" value={longitude} onChangeText={value => { setLongitude(value); setPoint(null); }} keyboardType="numbers-and-punctuation" style={layout.flex} /></View>
      <View style={layout.between}><TextLink onPress={() => action.run(getDeviceLocation, pick)}>{action.busy ? 'Mencari lokasi…' : 'Gunakan GPS'}</TextLink><TextLink onPress={() => setMapSelection(null)}>Batal memilih</TextLink></View>
      <Feedback message={action.message} />
      <Button title="Gunakan titik ini" onPress={usePoint} />
    </Card> : <>
      <Field placeholder="Cari nama jalan atau lokasi…" icon="search" value={query} onChangeText={setQuery} />
      <Chips options={['Semua', 'Banjir', 'Macet', 'Hambatan']} value={filter} onChange={setFilter} />
    </>}
    <View style={{ marginHorizontal: -16, position: 'relative', minHeight: mapSelection ? 280 : 500 }}>
      {demoEnabled && !mapSelection && !point ? <MapArtwork reports={filtered} selectedId={selected?.id} onSelect={report => setSelectedId(report.id)} /> : <LiveMap height={mapSelection ? 280 : 500} reports={filtered} selectedPoint={point} onPick={mapSelection ? pick : undefined} onSelectReport={report => setSelectedId(report.id)} />}
      {!mapSelection && <>
        <View style={{ position: 'absolute', left: 16, right: 16, top: 16, flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 9, backgroundColor: theme.colors.surface, borderRadius: 11, gap: 8 }}><V3Icon name="pinMap" /><AppText variant="tinyStrong">{filtered.length} laporan aktif</AppText></View>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 9, backgroundColor: theme.colors.surface, borderRadius: 11, gap: 5 }}><V3Icon name="legendFlood" /><AppText variant="tinyStrong">Banjir</AppText><V3Icon name="legendTraffic" /><AppText variant="tinyStrong">Macet</AppText></View>
        </View>
        <View style={{ position: 'absolute', right: 16, top: 75, gap: 12 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Atur filter laporan" onPress={() => setManual(value => !value)} style={{ padding: 11, backgroundColor: theme.colors.surface, borderRadius: 13 }}><V3Icon name="slidersMap" /></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Lihat lokasi saat ini" onPress={() => action.run(getDeviceLocation, pick)} style={{ padding: 11, backgroundColor: theme.colors.surface, borderRadius: 13 }}><V3Icon name="locate" /></Pressable>
        </View>
        {selected && <ReportSummary report={selected} onDetail={() => navigation.navigate('ReportDetail', { reportId: selected.id })} style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }} />}
      </>}
    </View>
    {!mapSelection && manual && <Chips options={['Semua', 'Banjir', 'Macet', 'Hambatan']} value={filter} onChange={setFilter} />}
    {!mapSelection && point && <Card><AppText variant="caption">Lokasi saat ini: {point.coordinate.latitude.toFixed(5)}, {point.coordinate.longitude.toFixed(5)}</AppText><TextLink onPress={() => setPoint(null)}>Kembali ke kondisi jalan</TextLink></Card>}
    {!mapSelection && <Feedback message={action.message || (!filtered.length ? 'Tidak ada laporan untuk pilihan ini. Data layanan nyata menunggu kontrak RUAS.' : '')} neutral={!action.message} />}
  </Screen>;
}
