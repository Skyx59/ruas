import { View } from 'react-native';
import { useAppContext } from '../hooks/useAppContext';
import { AppText, TextLink, layout } from './ui';
import { theme } from '../theme';
import ApiService from '../services/ApiService';

export default function DataNotice({ allowToggle = false }) {
  const { demoEnabled, changeDataMode } = useAppContext();
  const configured = ApiService.hasOperation('ruas', 'listReports') || ApiService.hasOperation('health', 'listFacilities');
  return <View style={layout.between}>
    <AppText variant="tiny" color={demoEnabled ? theme.colors.warning : theme.colors.muted}>{demoEnabled ? 'MODE DEMO · Data contoh, bukan API' : configured ? 'Mode layanan · Data melalui adapter API' : 'Mode layanan · Menunggu kontrak API'}</AppText>
    {allowToggle && <TextLink onPress={() => changeDataMode(!demoEnabled)}>{demoEnabled ? 'Tutup demo' : 'Lihat demo'}</TextLink>}
  </View>;
}
