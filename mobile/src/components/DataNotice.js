import { View } from 'react-native';
import { useAppContext } from '../hooks/useAppContext';
import { AppText, TextLink, layout } from './ui';
import { theme } from '../theme';
import { apiBaseUrls } from '../services/config';

export default function DataNotice({ allowToggle = false }) {
  const { demoEnabled, changeDataMode } = useAppContext();
  const configured = Boolean(apiBaseUrls.ruas);
  return <View style={layout.between}>
    <AppText variant="tiny" color={demoEnabled ? theme.colors.warning : theme.colors.muted}>{demoEnabled ? 'MODE DEMO · Data contoh, bukan API' : configured ? 'Mode layanan · RUAS API' : 'Mode layanan · Base URL RUAS belum diisi'}</AppText>
    {allowToggle && <TextLink onPress={() => changeDataMode(!demoEnabled)}>{demoEnabled ? 'Tutup demo' : 'Lihat demo'}</TextLink>}
  </View>;
}
