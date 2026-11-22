import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import RouteRecommendationScreen from '../screens/RouteRecommendationScreen';
import ReportFormScreen from '../screens/ReportFormScreen';
import ReportDetailScreen from '../screens/ReportDetailScreen';
import HealthFacilitiesScreen from '../screens/HealthFacilitiesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import BottomTabBar from './BottomTabBar';
import { theme } from '../theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator initialRouteName="Home" backBehavior="history" screenOptions={{ headerShown: false }} tabBar={props => <BottomTabBar {...props} />}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Peta" component={MapScreen} />
      <Tab.Screen name="Lapor" component={ReportFormScreen} />
      <Tab.Screen name="Faskes" component={HealthFacilitiesScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer theme={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, primary: theme.colors.primary, background: theme.colors.background, card: theme.colors.surface, text: theme.colors.text, border: theme.colors.border } }}>
      <Stack.Navigator initialRouteName="MainTabs" screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="RekomendasiRute" component={RouteRecommendationScreen} />
        <Stack.Screen name="DetailLaporan" component={ReportDetailScreen} options={{ title: 'Detail laporan' }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login' }} />
        <Stack.Screen name="PilihLokasi" component={MapScreen} options={{ presentation: 'modal', gestureEnabled: true, title: 'Pilih lokasi' }} />
        <Stack.Screen name="Registrasi" component={RegisterScreen} options={{ title: 'Registrasi' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
