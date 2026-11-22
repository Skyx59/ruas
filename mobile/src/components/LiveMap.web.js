import { View } from 'react-native';
import { AppText, TextLink, layout } from './ui';
import { theme } from '../theme';

export default function LiveMap({ reports = [], facilities = [], onSelectReport, onSelectFacility, height = 230 }) {
  return <View style={{ minHeight: height, padding: 16, gap: 12, backgroundColor: theme.colors.soft, justifyContent: 'center' }}>
    <AppText variant="label">Peta interaktif tersedia di Android/iOS.</AppText>
    <AppText variant="caption" color={theme.colors.muted}>Preview web mendukung input koordinat manual. Gunakan Expo Go untuk memilih titik langsung pada peta.</AppText>
    <View style={layout.group}>{reports.map(report => <TextLink key={report.id} onPress={() => onSelectReport?.(report)}>{report.title}</TextLink>)}{facilities.map(facility => <TextLink key={facility.id} onPress={() => onSelectFacility?.(facility)}>{facility.name}</TextLink>)}</View>
  </View>;
}
