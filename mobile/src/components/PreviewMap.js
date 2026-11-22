import { Image, Pressable, View } from 'react-native';
import { AppText } from './ui';
import { theme } from '../theme';
import V3Icon from './V3Icon';

const images = {
  home: require('../../assets/v3/home-map.png'),
  facilities: require('../../assets/v3/facilities-map.png'),
  routes: require('../../assets/v3/routes-map.png'),
  detail: require('../../assets/v3/detail-map.png'),
};
const ratios = { home: 358 / 91, facilities: 358 / 155, routes: 358 / 230, detail: 358 / 181 };

export default function PreviewMap({ variant, label, onPress }) {
  const content = <><Image source={images[variant]} resizeMode="contain" accessibilityLabel="Ilustrasi peta demo dari Figma v3, bukan peta navigasi aktual" style={{ width: '100%', aspectRatio: ratios[variant] }} />{label && <View style={{ position: 'absolute', top: 10, left: variant === 'home' ? 11 : 12, minWidth: variant === 'home' ? 147 : undefined, minHeight: 28, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: theme.colors.surface, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 7 }}>{variant === 'home' && <V3Icon name="pinSmall" />}<AppText variant="tinyStrong">{label}</AppText></View>}</>;
  return onPress ? <Pressable accessibilityRole="button" accessibilityLabel={label || 'Buka peta'} onPress={onPress} style={{ overflow: 'hidden', borderRadius: variant === 'facilities' ? 14 : 0 }}>{content}</Pressable> : <View style={{ overflow: 'hidden', borderRadius: variant === 'facilities' ? 14 : 0 }}>{content}</View>;
}
