import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import RouteRecommendationScreen from '../screens/RouteRecommendationScreen';
import ReportFormScreen from '../screens/ReportFormScreen';
import ReportDetailScreen from '../screens/ReportDetailScreen';
import HealthFacilitiesScreen from '../screens/HealthFacilitiesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import { theme } from '../theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ tabBarActiveTintColor: theme.colors.primary, tabBarIcon: () => null }}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Beranda' }} />
      <Tab.Screen name="Routes" component={RouteRecommendationScreen} options={{ title: 'Rute' }} />
      <Tab.Screen name="ReportForm" component={ReportFormScreen} options={{ title: 'Laporan' }} />
      <Tab.Screen name="Health" component={HealthFacilitiesScreen} options={{ title: 'Kesehatan' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Akun' }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="ReportDetail" component={ReportDetailScreen} options={{ title: 'Detail laporan' }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
