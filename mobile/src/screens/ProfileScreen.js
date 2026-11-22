import { Button, Text } from 'react-native';
import ScaffoldScreen from '../components/ScaffoldScreen';
import { useAppContext } from '../hooks/useAppContext';

export default function ProfileScreen({ navigation }) {
  const { session } = useAppContext();

  return (
    <ScaffoldScreen title="Akun dan Profil" description="Area profil dan autentikasi pengguna RUAS.">
      <Text>{session ? 'State sesi tersedia.' : 'Belum ada sesi pengguna.'}</Text>
      <Button title="Buka layar login" onPress={() => navigation.navigate('Login')} />
    </ScaffoldScreen>
  );
}
