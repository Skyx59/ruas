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
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={props => <BottomTabBar {...props} />}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="ReportForm" component={ReportFormScreen} />
      <Tab.Screen name="Health" component={HealthFacilitiesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer theme={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, primary: theme.colors.primary, background: theme.colors.background, card: theme.colors.surface, text: theme.colors.text, border: theme.colors.border } }}>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Routes" component={RouteRecommendationScreen} />
        <Stack.Screen name="ReportDetail" component={ReportDetailScreen} options={{ title: 'Detail laporan' }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login' }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Registrasi' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
