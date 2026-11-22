import { useEffect, useState } from 'react';
import { Keyboard, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../components/ui';
import V3Icon from '../components/V3Icon';
import { theme } from '../theme';

const items = { Home: ['Home', 'home'], Peta: ['Peta', 'map'], Lapor: ['Lapor', 'report'], Faskes: ['Faskes', 'facility'], Profil: ['Profil', 'profile'] };

export default function BottomTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  if (keyboardVisible) return null;
  return <View style={{ flexDirection: 'row', backgroundColor: theme.colors.surface, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 8, paddingBottom: insets.bottom, minHeight: 65 + insets.bottom }}>
    {state.routes.map((route, index) => {
      const focused = state.index === index;
      const [label, icon] = items[route.name];
      function press() {
        const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
        if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
      }
      return <Pressable key={route.key} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: focused }} aria-selected={focused} onPress={press} onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
        <View style={{ width: 54, height: 38, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? theme.colors.soft : 'transparent' }}><V3Icon name={`${icon}${focused ? 'Active' : ''}`} /></View>
        <AppText variant={focused ? 'tinyStrong' : 'tiny'} color={focused ? theme.colors.primary : theme.colors.muted}>{label}</AppText>
      </Pressable>;
    })}
  </View>;
}
