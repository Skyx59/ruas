import { Pressable, View } from 'react-native';
import { useEffect, useState } from 'react';
import { AppText, Badge, Card, Feedback, GradientCard, Header, Screen, SectionHeading, layout } from '../components/ui';
import V3Icon from '../components/V3Icon';
import DataNotice from '../components/DataNotice';
import TripForm from '../components/TripForm';
import PreviewMap from '../components/PreviewMap';
import LiveMap from '../components/LiveMap';
import { useAppContext } from '../hooks/useAppContext';
import { validateTrip } from '../utils/validation';
import { theme } from '../theme';

export default function HomeScreen({ navigation }) {
  const { reports, weather, activeRoute, trip, demoEnabled, dataMessage } = useAppContext();
  const [errors, setErrors] = useState({});
  useEffect(() => setErrors({}), [trip]);
  const activeReports = reports.filter(report => !['resolved', 'rejected'].includes(report.status));
  function search() {
    const next = validateTrip(trip);
    setErrors(next);
    if (!Object.keys(next).length) navigation.navigate('RekomendasiRute');
  }
  return <Screen>
    <Header title="RUAS" brand subtitle="Kenali jalan, tentukan arah." trailing={<Pressable accessibilityRole="button" accessibilityLabel="Lihat laporan kondisi jalan" onPress={() => navigation.navigate('Peta')} style={{ padding: 9, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, backgroundColor: theme.colors.surface }}><V3Icon name="bell" /></Pressable>} />
    <DataNotice allowToggle />
    <GradientCard style={{ minHeight: 113, paddingLeft: 17 }}>
      <View style={{ position: 'absolute', left: 5, top: 19, height: 74, width: 3, backgroundColor: theme.colors.yellow, borderRadius: 2 }} />
      <AppText variant="tinyStrong" color="#FFE49B">{weather ? `CUACA DI ${weather.locationLabel.toUpperCase()}` : 'INFORMASI CUACA'}</AppText>
      <AppText color={theme.colors.surface} style={{ fontFamily: theme.fonts.bold, fontSize: 32, lineHeight: 42 }}>{weather?.temperatureLabel || '—'}</AppText>
      <AppText variant="tiny" color="#E7EBFF" style={{ maxWidth: '73%' }}>{weather ? `${weather.description} · ${weather.updatedLabel}` : 'Data lingkungan RUAS belum tersedia.'}</AppText>
      <View style={{ position: 'absolute', right: 18, top: 19 }}><V3Icon name="weatherHalo" /></View>
      <View style={{ position: 'absolute', right: 32, top: 32 }}><V3Icon name="cloud" /></View>
      <View style={{ position: 'absolute', right: 74, top: 23 }}><V3Icon name="sun" /></View>
    </GradientCard>
    <Card style={{ paddingVertical: 10 }}><View style={layout.between}><View style={layout.row}><V3Icon name="signal" /><AppText variant="label">{demoEnabled || reports.length ? `${activeReports.length} laporan aktif` : 'Laporan belum tersedia'}</AppText></View><AppText variant="tiny" color={theme.colors.muted}>Kondisi sekitar</AppText></View></Card>
    <View style={layout.section}>
      <SectionHeading action="Detail" onAction={() => navigation.navigate('RekomendasiRute')}>Rute Aktif</SectionHeading>
      <Card style={{ borderLeftWidth: 4, borderLeftColor: theme.colors.primary }}>
        {activeRoute ? <View style={layout.row}>
          <View style={{ alignItems: 'center', alignSelf: 'stretch', justifyContent: 'space-between' }}><V3Icon name="originDot" /><View style={{ width: 3, flex: 1, backgroundColor: theme.colors.primary, marginVertical: 3 }} /><V3Icon name="destinationDot" /></View>
          <View style={[layout.flex, { gap: 5 }]}><View style={layout.between}><AppText variant="label" numberOfLines={2} style={{ flex: 1 }}>{activeRoute.trip.origin.label}</AppText><Badge tone={activeRoute.riskTone}>{activeRoute.riskLabel}</Badge></View><AppText variant="tiny" color={theme.colors.muted}>{activeRoute.viaLabel || 'Rute pilihan Anda'}</AppText><AppText variant="label">{activeRoute.trip.destination.label}</AppText><AppText variant="tiny" color={theme.colors.muted}>{activeRoute.durationLabel} · {activeRoute.distanceLabel}</AppText></View>
        </View> : <AppText variant="caption" color={theme.colors.muted}>Belum ada rute aktif. Pilih alternatif perjalanan untuk mengaktifkannya.</AppText>}
      </Card>
    </View>
    <View style={layout.section}><SectionHeading>Cari Rute Baru</SectionHeading><TripForm navigation={navigation} onSubmit={search} errors={errors} /></View>
    <View style={layout.section}>
      <SectionHeading action="Peta lengkap" onAction={() => navigation.navigate('Peta')}>Kondisi Jalan Sekitar</SectionHeading>
      {demoEnabled ? <PreviewMap variant="home" label="Laporan di peta" onPress={() => navigation.navigate('Peta')} /> : <LiveMap height={140} reports={activeReports} onSelectReport={report => navigation.navigate('DetailLaporan', { reportId: report.id })} />}
    </View>
    <Feedback message={dataMessage} />
  </Screen>;
}
