import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { AppText, Badge, Button, Card, Chips, Feedback, GradientCard, Header, Screen, SectionHeading, TextLink, layout } from '../components/ui';
import DataNotice from '../components/DataNotice';
import PreviewMap from '../components/PreviewMap';
import LiveMap from '../components/LiveMap';
import V3Icon from '../components/V3Icon';
import { useAppContext } from '../hooks/useAppContext';
import { useAction } from '../hooks/useAction';
import { theme } from '../theme';

export default function RouteRecommendationScreen({ navigation }) {
  const { trip, travelMode, changeTravelMode, routes, recommendRoutes, selectedRouteId, setSelectedRouteId, activateRoute, demoEnabled, walkability, loadWalkability } = useAppContext();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const stepSafe = useAction();
  const selection = useAction();
  const selected = routes.find(route => route.id === selectedRouteId);
  useEffect(() => {
    let current = true;
    setBusy(true);
    setMessage('');
    recommendRoutes().catch(error => { if (current) setMessage(error.message); }).finally(() => { if (current) setBusy(false); });
    return () => { current = false; };
  }, [recommendRoutes]);
  function editTrip() { navigation.popTo('MainTabs', { screen: 'Home' }); }
  return <Screen>
    <Header title="Rekomendasi Rute" subtitle="Temukan perjalanan dengan risiko lebih rendah" navigation={navigation} />
    <DataNotice />
    <Card style={{ gap: 6 }}><View style={layout.between}><View style={[layout.flex, { gap: 8 }]}><View style={layout.row}><V3Icon name="pinRoute" /><AppText variant="label">{trip.origin.label || 'Tentukan titik asal'}</AppText></View><View style={layout.row}><V3Icon name="flag" /><AppText variant="label">{trip.destination.label || 'Tentukan tujuan'}</AppText></View></View><TextLink onPress={editTrip}>Ubah</TextLink></View></Card>
    <Chips options={[{ value: 'vehicle', label: 'Kendaraan' }, { value: 'walking', label: 'Jalan kaki' }]} value={travelMode} onChange={changeTravelMode} />
    {demoEnabled && routes.length > 0 ? <PreviewMap variant="routes" label={`${routes.length} alternatif contoh`} /> : <LiveMap height={230} points={[trip.origin, trip.destination]} routeGeometry={selected?.geometry} />}
    <SectionHeading>Bandingkan Alternatif</SectionHeading>
    {busy && <AppText variant="caption" color={theme.colors.muted}>Meminta alternatif perjalanan…</AppText>}
    <Feedback message={message} />
    {!busy && !routes.length && <Card><AppText variant="caption" color={theme.colors.muted}>Rekomendasi rute blocked: backend RUAS belum menyediakan endpoint rute. Waktu, jarak, dan risiko tidak dihitung oleh mobile.</AppText><Button title="Ubah perjalanan" variant="outline" onPress={editTrip} /></Card>}
    {routes.map(route => <Pressable key={route.id} accessibilityRole="button" accessibilityLabel={`Pilih ${route.name}`} accessibilityState={{ selected: selectedRouteId === route.id }} aria-pressed={selectedRouteId === route.id} onPress={() => setSelectedRouteId(route.id)}>
      <GradientCard colors={selectedRouteId === route.id ? [theme.colors.surface, '#F0F3FF'] : [theme.colors.surface, theme.colors.surface]} style={{ borderWidth: 1, borderLeftWidth: selectedRouteId === route.id ? 4 : 1, borderColor: selectedRouteId === route.id ? theme.colors.primary : theme.colors.border, borderRadius: 13, gap: 8, padding: 14 }}>
        <View style={layout.between}><AppText variant="label">{route.name}</AppText>{route.recommended && <Badge>Direkomendasikan</Badge>}<AppText variant="label">{route.durationLabel}</AppText></View>
        <View style={layout.between}><AppText variant="caption" color={theme.colors.muted}>Jarak {route.distanceLabel}</AppText>{!route.recommended && <Badge tone={route.riskTone}>{route.riskLabel}</Badge>}</View>
        {route.recommended && <View style={layout.row}><V3Icon name="shieldRoute" /><AppText variant="caption" color={theme.colors.primary}>{route.riskLabel}</AppText></View>}
        {route.explanation && <AppText variant="tiny" color={theme.colors.muted}>{route.explanation}</AppText>}
      </GradientCard>
    </Pressable>)}
    <GradientCard colors={[theme.colors.soft, '#F4F6FF']} style={{ borderRadius: 10, borderLeftWidth: 4, borderLeftColor: theme.colors.primary, padding: 12, gap: 10 }}>
      <View style={layout.row}><V3Icon name="foot" /><AppText variant="tinyStrong" color={theme.colors.primary}>{travelMode === 'walking' ? 'Kelayakan berjalan kaki dari StepSafe' : 'StepSafe tersedia saat memilih mode jalan kaki'}</AppText></View>
      {travelMode === 'walking' && <>
        <AppText variant="caption" color={theme.colors.muted}>{walkability?.summary || 'Walkability Index dan aksesibilitas hanya ditampilkan setelah diterima dari layanan mitra.'}</AppText>
        {walkability?.indexLabel && <AppText variant="label">{walkability.indexLabel}</AppText>}
        <Button title="Periksa StepSafe" small variant="outline" busy={stepSafe.busy} onPress={() => stepSafe.run(loadWalkability)} />
        <Feedback message={stepSafe.message} />
      </>}
    </GradientCard>
    <Feedback message={selection.message} />
    <Button title={selected ? `Aktifkan ${selected.name}` : 'Pilih alternatif rute'} disabled={!selected} onPress={() => selection.run(async () => activateRoute(), () => navigation.popTo('MainTabs', { screen: 'Home' }))} />
  </Screen>;
}
