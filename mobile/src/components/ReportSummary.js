import { View } from 'react-native';
import { AppText, Badge, Button, Card, layout } from './ui';
import V3Icon from './V3Icon';
import { theme } from '../theme';

export const reportStatus = {
  pending: { label: 'Perlu verifikasi', tone: 'warning' },
  verified: { label: 'Terverifikasi', tone: 'success' },
  resolved: { label: 'Selesai', tone: 'primary' },
  rejected: { label: 'Ditolak', tone: 'danger' },
};

export default function ReportSummary({ report, onDetail, style }) {
  const status = reportStatus[report.status] || { label: 'Status belum dipetakan', tone: 'primary' };
  return <Card style={style}>
    <View style={{ width: 55, height: 4, borderRadius: 3, backgroundColor: theme.colors.border, alignSelf: 'center', marginTop: -5, marginBottom: 8 }} />
    <View style={layout.row}><View style={{ backgroundColor: theme.colors.background, padding: 10, borderRadius: 12 }}><V3Icon name={report.type === 'Banjir' ? 'waves' : 'pinReport'} /></View><View style={layout.flex}><AppText variant="label" numberOfLines={2}>{report.title}</AppText><AppText variant="tiny" color={theme.colors.muted} style={{ marginTop: 6 }}>{report.timeLabel}</AppText></View></View>
    <View style={layout.between}><Badge tone={status.tone}>{status.label}</Badge><Button title="Lihat Detail" small onPress={onDetail} /></View>
    <AppText variant="tiny" color={theme.colors.muted}>Ketuk penanda lain untuk melihat laporan berikutnya.</AppText>
  </Card>;
}
