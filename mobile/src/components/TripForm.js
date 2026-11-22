import { TextInput, View } from 'react-native';
import { useAppContext } from '../hooks/useAppContext';
import { useAction } from '../hooks/useAction';
import { getDeviceLocation } from '../services/deviceLocation';
import { theme } from '../theme';
import { Button, Card, Feedback, TextLink, layout } from './ui';
import V3Icon from './V3Icon';

export default function TripForm({ navigation, onSubmit, errors = {} }) {
  const { trip, updateTrip, setMapSelection } = useAppContext();
  const action = useAction();
  function pick(key) {
    setMapSelection(key);
    navigation.navigate('Map');
  }
  return <Card>
    <View style={layout.row}>
      <V3Icon name="navigation" />
      <TextInput accessibilityLabel="Asal perjalanan" placeholder="Titik asal perjalanan" placeholderTextColor={theme.colors.muted} value={trip.origin.label} onChangeText={label => updateTrip('origin', { label, coordinate: null })} style={{ flex: 1, minWidth: 0, minHeight: 30, fontFamily: theme.fonts.medium, fontSize: 13, color: theme.colors.text }} />
      <TextLink onPress={() => action.run(getDeviceLocation, point => updateTrip('origin', point))}>{action.busy ? 'Mencari…' : trip.origin.source === 'gps' ? 'GPS aktif' : 'GPS'}</TextLink>
    </View>
    <Feedback message={errors.origin} />
    <View style={layout.divider} />
    <View style={layout.row}>
      <V3Icon name="pinYellow" />
      <TextInput accessibilityLabel="Tujuan perjalanan" placeholder="Ke mana tujuan Anda?" placeholderTextColor={theme.colors.muted} value={trip.destination.label} onChangeText={label => updateTrip('destination', { label, coordinate: null })} style={{ flex: 1, minWidth: 0, minHeight: 30, fontFamily: theme.fonts.regular, fontSize: 13, color: theme.colors.text }} />
    </View>
    <Feedback message={errors.destination} />
    <View style={layout.between}><TextLink onPress={() => pick('origin')}>Pilih asal di peta</TextLink><TextLink onPress={() => pick('destination')}>Pilih tujuan di peta</TextLink></View>
    <Feedback message={action.message} />
    <Button title="Cari Alternatif Rute" onPress={onSubmit} icon="arrow" />
  </Card>;
}
