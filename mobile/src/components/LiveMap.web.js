import { View } from 'react-native';
import { AppText, TextLink, layout } from './ui';
import { theme } from '../theme';

export default function LiveMap({ reports = [], facilities = [], onSelectReport, onSelectFacility, height = 230 }) {
  return <View style={{ height, minHeight: 140, padding: 16, gap: 12, backgroundColor: theme.colors.soft, justifyContent: 'center' }}>
    <AppText variant="label">Peta interaktif tersedia di Android/iOS.</AppText>
    <AppText variant="caption" color={theme.colors.muted}>Gunakan Expo Go untuk mengetuk lokasi pada peta. Tidak ada hasil pencarian lokasi rekaan pada preview web.</AppText>
    <View style={layout.group}>{reports.map(report => <TextLink key={report.id} onPress={() => onSelectReport?.(report)}>{report.title}</TextLink>)}{facilities.map(facility => <TextLink key={facility.id} onPress={() => onSelectFacility?.(facility)}>{facility.name}</TextLink>)}</View>
  </View>;
}
