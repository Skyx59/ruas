import { Pressable, View } from 'react-native';
import { useAppContext } from '../hooks/useAppContext';
import { useAction } from '../hooks/useAction';
import { getDeviceLocation } from '../services/deviceLocation';
import { theme } from '../theme';
import { AppText, Button, Card, Feedback, TextLink, layout } from './ui';
import V3Icon from './V3Icon';

export default function TripForm({ navigation, onSubmit, errors = {} }) {
  const { trip, updateTrip, locationMessage } = useAppContext();
  const action = useAction();
  function pick(key) { navigation.navigate('PilihLokasi', { selection: key }); }
  return <Card>
    <View style={layout.row}>
      <V3Icon name="navigation" />
      <Pressable accessibilityRole="button" accessibilityLabel="Pilih asal di peta" onPress={() => pick('origin')} style={{ flex: 1, paddingVertical: 8 }}><AppText variant="tiny" color={theme.colors.muted}>Asal perjalanan</AppText><AppText variant="label" numberOfLines={2}>{trip.origin.label || 'Menunggu GPS / pilih di peta'}</AppText></Pressable>
      <TextLink onPress={() => action.run(getDeviceLocation, point => updateTrip('origin', point))}>{action.busy ? 'Mencari…' : 'GPS'}</TextLink>
    </View>
    <Feedback message={errors.origin} />
    <View style={layout.divider} />
    <View style={layout.row}>
      <V3Icon name="pinYellow" />
      <Pressable accessibilityRole="button" accessibilityLabel="Pilih tujuan di peta" onPress={() => pick('destination')} style={{ flex: 1, paddingVertical: 8 }}><AppText variant="tiny" color={theme.colors.muted}>Tujuan perjalanan</AppText><AppText variant="label" numberOfLines={2}>{trip.destination.label || 'Ketuk untuk memilih tujuan di peta'}</AppText></Pressable>
      <TextLink onPress={() => navigation.navigate('Faskes')}>Faskes</TextLink>
    </View>
    <Feedback message={errors.destination || action.message || (!trip.origin.coordinate ? locationMessage : '')} />
    <Button title="Cari Alternatif Rute" onPress={onSubmit} icon="arrow" />
  </Card>;
}
