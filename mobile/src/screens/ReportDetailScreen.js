import { View } from 'react-native';
import { AppText, Badge, Button, Card, Feedback, GradientCard, Header, Notice, Screen, SectionHeading, layout } from '../components/ui';
import DataNotice from '../components/DataNotice';
import PreviewMap from '../components/PreviewMap';
import LiveMap from '../components/LiveMap';
import V3Icon from '../components/V3Icon';
import { reportStatus } from '../components/ReportSummary';
import { useAppContext } from '../hooks/useAppContext';
import { useAction } from '../hooks/useAction';
import { theme } from '../theme';

export default function ReportDetailScreen({ route, navigation }) {
  const { reports, demoEnabled, session, confirmReport } = useAppContext();
  const action = useAction();
  const report = reports.find(item => item.id === route.params?.reportId);
  const status = reportStatus[report?.status] || { label: 'Status belum dipetakan', tone: 'primary' };
  return <Screen>
    <Header title="Detail Laporan" navigation={navigation} />
    <DataNotice />
    {report ? <>
      <GradientCard colors={[theme.colors.dark, '#2B4379']} style={{ minHeight: 104, borderRadius: 15, padding: 14, paddingRight: 65, gap: 7 }}>
        <Badge>{report.type.toUpperCase()}</Badge>
        <AppText variant="heading" color={theme.colors.surface}>{report.location.label}</AppText>
        <AppText variant="tiny" color="#E0E7FA">Dilaporkan {report.timeLabel}</AppText>
        <View style={{ position: 'absolute', right: 20, top: 31 }}><V3Icon name="warning" /></View>
      </GradientCard>
      {demoEnabled ? <PreviewMap variant="detail" label="Lokasi laporan" /> : <LiveMap height={181} points={[report.location]} />}
      <View style={layout.section}><SectionHeading>Informasi Kejadian</SectionHeading><Card>
        <View style={layout.between}><AppText variant="caption" color={theme.colors.muted}>Keparahan</AppText><AppText variant="label">{report.severity}</AppText></View><View style={layout.divider} />
        <View style={layout.between}><AppText variant="caption" color={theme.colors.muted}>Status</AppText><Badge tone={status.tone}>{status.label}</Badge></View><View style={layout.divider} />
        <View style={layout.between}><AppText variant="caption" color={theme.colors.muted}>Laporan oleh</AppText><AppText variant="label">{report.reporterLabel}</AppText></View>
      </Card></View>
      <View style={layout.section}><SectionHeading>Deskripsi Kejadian</SectionHeading><AppText variant="caption" color={theme.colors.muted}>{report.description}</AppText></View>
      <Notice title={session?.account?.role === 'ADMIN' ? 'Verifikasi laporan' : 'Konfirmasi kondisi'} detail={session?.account?.role === 'ADMIN' ? 'Setujui atau tolak laporan sesuai hasil pemeriksaan.' : 'Konfirmasi warga masih blocked: API hanya mendukung verifikasi oleh ADMIN.'} icon="info" warning gradient />
      <Feedback message={action.message} />
      <View style={layout.row}><Button title={session?.account?.role === 'ADMIN' ? 'Verifikasi' : 'Masih Terjadi'} style={layout.flex} busy={action.busy} onPress={() => action.run(() => confirmReport(report.id, session?.account?.role === 'ADMIN' ? 'verified' : 'ongoing'))} /><Button title={session?.account?.role === 'ADMIN' ? 'Tolak laporan' : 'Sudah Selesai'} variant="outline" style={layout.flex} disabled={action.busy} onPress={() => action.run(() => confirmReport(report.id, session?.account?.role === 'ADMIN' ? 'rejected' : 'resolved'))} /></View>
    </> : <Card><AppText variant="caption" color={theme.colors.muted}>Laporan tidak tersedia pada sumber data saat ini. Kembali ke peta dan pilih laporan yang tersedia.</AppText><Button title="Kembali" variant="outline" onPress={() => navigation.goBack()} /></Card>}
  </Screen>;
}
