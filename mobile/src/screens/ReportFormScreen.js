import { Button } from 'react-native';
import ScaffoldScreen from '../components/ScaffoldScreen';

export default function ReportFormScreen({ navigation }) {
  return (
    <ScaffoldScreen title="Laporan Kondisi Jalan" description="Area form laporan dan validasi input yang akan dikembangkan.">
      <Button title="Buka kerangka detail laporan" onPress={() => navigation.navigate('ReportDetail')} />
    </ScaffoldScreen>
  );
}
