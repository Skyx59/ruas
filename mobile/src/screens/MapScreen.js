import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { AppText, Button, Card, Chips, Feedback, Field, Header, Screen, TextLink, layout } from '../components/ui';
import LiveMap from '../components/LiveMap';
import ReportSummary from '../components/ReportSummary';
import { useAppContext } from '../hooks/useAppContext';
import { useAction } from '../hooks/useAction';
import { describeLocation, getDeviceLocation } from '../services/deviceLocation';
import { isCoordinate } from '../utils/validation';
import { theme } from '../theme';

export default function MapScreen({ navigation, route }) {
  const { reports, trip, setMapSelection, setReportLocation, reportLocation, updateTrip, dataMessage } = useAppContext();
  const mapSelection = route.name === 'PilihLokasi' && ['origin', 'destination', 'report'].includes(route.params?.selection) ? route.params.selection : null;
  const [filter, setFilter] = useState('Semua');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [point, setPoint] = useState(null);
  const version = useRef(0);
  const action = useAction();
  const filtered = useMemo(() => reports.filter(report => (filter === 'Semua' || report.type === (filter === 'Macet' ? 'Kemacetan' : filter)) && `${report.title} ${report.location.label}`.toLowerCase().includes(query.trim().toLowerCase())), [reports, filter, query]);
  const selected = filtered.find(report => report.id === selectedId) || filtered[0];
  useEffect(() => {
    version.current += 1;
    setPoint(mapSelection === 'report' ? reportLocation : mapSelection ? trip[mapSelection] : null);
    action.setMessage('');
    return () => { version.current += 1; };
  }, [mapSelection]);
  function pick(next) {
    if (!isCoordinate(next?.coordinate)) return;
    const current = ++version.current;
    setPoint({ ...next, label: next.source === 'gps' ? next.label : 'Titik yang dipilih' });
    action.setMessage('');
    if (next.source !== 'gps') describeLocation(next.coordinate).then(label => {
      if (current === version.current) setPoint({ ...next, label });
    });
  }
  function finish(cancel = false) {
    if (!cancel && !isCoordinate(point?.coordinate)) return action.setMessage('Ketuk satu titik di peta atau gunakan GPS.');
    if (!cancel) {
      if (mapSelection === 'report') setReportLocation(point);
      else if (['origin', 'destination'].includes(mapSelection)) updateTrip(mapSelection, point);
    }
    setMapSelection(null);
    navigation.goBack();
  }
  return <Screen scroll={false} contentStyle={{ gap: 10, paddingBottom: 12 }}>
    <Header navigation={mapSelection ? navigation : undefined} title={mapSelection ? mapSelection === 'report' ? 'Lokasi Kejadian' : mapSelection === 'origin' ? 'Pilih Asal' : 'Pilih Tujuan' : 'Peta Kondisi Jalan'} subtitle={mapSelection ? 'Ketuk peta sekali untuk menentukan lokasi' : 'Laporan kondisi jalan di sekitar Anda'} />
    {!mapSelection && <><Field placeholder="Cari laporan atau nama jalan…" icon="search" value={query} onChangeText={setQuery} /><Chips options={['Semua', 'Banjir', 'Macet', 'Hambatan']} value={filter} onChange={setFilter} /></>}
    <View style={{ flex: 1, minHeight: 180, marginHorizontal: -16, overflow: 'hidden' }}>
      <LiveMap height="100%" reports={mapSelection ? [] : filtered} points={mapSelection ? [trip.origin, trip.destination] : []} selectedPoint={point} onPick={mapSelection ? pick : undefined} onSelectReport={report => setSelectedId(report.id)} />
    </View>
    {mapSelection ? <Card style={{ gap: 10, padding: 12 }}>
      <View style={layout.between}><AppText variant="label" style={{ flex: 1 }} numberOfLines={2}>{point?.label || 'Belum ada lokasi dipilih'}</AppText><TextLink onPress={() => action.run(getDeviceLocation, pick)}>{action.busy ? 'Mencari…' : 'Gunakan GPS'}</TextLink></View>
      <Feedback message={action.message} />
      <Button title="Gunakan lokasi ini" disabled={!isCoordinate(point?.coordinate) || action.busy} onPress={() => finish()} />
      <TextLink onPress={() => finish(true)}>Batal memilih lokasi</TextLink>
    </Card> : <>
      {selected && <ReportSummary report={selected} onDetail={() => navigation.navigate('DetailLaporan', { reportId: selected.id })} style={{ padding: 10, gap: 6 }} />}
      <Feedback message={action.message || dataMessage || (!filtered.length ? 'Belum ada laporan yang cocok.' : '')} neutral={!action.message && !dataMessage} />
    </>}
  </Screen>;
}
