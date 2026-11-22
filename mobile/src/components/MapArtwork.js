import { useState } from 'react';
import { Pressable, View } from 'react-native';
import V3Icon from './V3Icon';
import { AppText } from './ui';

const layers = [
  ['mapBase', 0, 15.5], ['mapBlocks', 0, 15.5], ['mapWater', 110, 220.5], ['mapParks', 114, 30.5],
  ['mapRoadBorder', -30.78, -16.29], ['mapRoads', -30.59, -15.89], ['mapStreets', 0, 5.5],
];
const positions = {
  flood: { left: 71, top: 165.5, asset: 'markerFlood', sign: 'markerSign' },
  traffic: { left: 255, top: 255.5, asset: 'markerTraffic', sign: 'markerSign' },
  obstacle: { left: 159, top: 386.5, asset: 'markerObstacle', sign: 'markerObstacleSign' },
  other: { left: 311, top: 108.5, asset: 'markerOther' },
};

export default function MapArtwork({ reports, selectedId, onSelect }) {
  const [width, setWidth] = useState(390);
  const scale = width / 390;
  return <View onLayout={event => setWidth(event.nativeEvent.layout.width)} style={{ width: '100%', height: 551 * scale, overflow: 'hidden' }}>
    <View style={{ width: 390, height: 551, position: 'absolute', transform: [{ scale }], transformOrigin: 'top left', overflow: 'hidden' }}>
      {layers.map(([asset, left, top]) => <View key={asset} style={{ position: 'absolute', left, top }}><V3Icon name={asset} /></View>)}
      {[['Jl. Dago', 174, 65.5], ['Jl. Merdeka', 25, 259.5], ['Bandung', 262, 383.5], ['Jl. Dipatiukur', 53, 405.5]].map(([label, left, top]) => <AppText key={label} style={{ position: 'absolute', left, top, color: '#74877C', fontSize: 12 }}>{label}</AppText>)}
      {reports.map(report => {
        const point = positions[report.previewMarker];
        if (!point) return null;
        return <Pressable key={report.id} accessibilityRole="button" accessibilityLabel={`Laporan: ${report.title}`} accessibilityState={{ selected: report.id === selectedId }} onPress={() => onSelect?.(report)} style={{ position: 'absolute', left: point.left, top: point.top, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <V3Icon name={point.asset} />
          {point.sign && <View style={{ position: 'absolute', left: point.sign === 'markerSign' ? 20.5 : 17, top: point.sign === 'markerSign' ? 13.5 : 17 }}><V3Icon name={point.sign} /></View>}
        </Pressable>;
      })}
    </View>
  </View>;
}
