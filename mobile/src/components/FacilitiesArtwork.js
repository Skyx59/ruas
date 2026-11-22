import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from './ui';
import V3Icon from './V3Icon';
import { theme } from '../theme';

const layers = [['facilityBase', 0, 0], ['facilityBlocks', 0, 0], ['facilityParks', 99, 10], ['facilityRoadBorder', -18, -23.39], ['facilityRoads', -18, -22.98], ['facilityStreet', 0, 74.5]];
const positions = {
  'demo-facility-1': [87, 48, 'facilityMarkerA'],
  'demo-facility-2': [234, 55, 'facilityMarkerB'],
  'demo-facility-3': [177, 105, 'facilityMarkerC'],
};

export default function FacilitiesArtwork({ facilities, onSelect }) {
  const [width, setWidth] = useState(358);
  const scale = width / 358;
  return <View onLayout={event => setWidth(event.nativeEvent.layout.width)} style={{ width: '100%', height: 155 * scale, borderRadius: 14, overflow: 'hidden' }}>
    <View style={{ width: 358, height: 155, position: 'absolute', transform: [{ scale }], transformOrigin: 'top left', overflow: 'hidden' }}>
      {layers.map(([asset, left, top]) => <View key={asset} style={{ position: 'absolute', left, top }}><V3Icon name={asset} /></View>)}
      {[['Jl. Dago', 138, 28], ['Bandung', 33, 78], ['Coblong', 242, 123]].map(([label, left, top]) => <AppText key={label} style={{ position: 'absolute', left, top, fontSize: 9, lineHeight: 11, color: '#7A92A1' }}>{label}</AppText>)}
      {facilities.map(facility => {
        const point = positions[facility.id];
        return point ? <Pressable key={facility.id} accessibilityRole="button" accessibilityLabel={`Fasilitas di peta: ${facility.name}`} onPress={() => onSelect(facility)} style={{ position: 'absolute', left: point[0], top: point[1], width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><V3Icon name={point[2]} /></Pressable> : null;
      })}
      <View style={{ position: 'absolute', top: 11, left: 12, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: theme.colors.surface }}><AppText variant="tinyStrong" color={theme.colors.primary}>{facilities.length} fasilitas contoh</AppText></View>
    </View>
  </View>;
}
