
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import CheckInScreen from './src/screens/CheckInScreen';
import LocationsScreen from './src/screens/LocationsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RestDaysScreen from './src/screens/RestDaysScreen';
import { RefreshProvider } from './src/context/RefreshContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function ProfileStackScreen() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen}
        options={{ 
          title: 'Perfil',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen 
        name="RestDays" 
        component={RestDaysScreen}
        options={{ 
          title: 'Días de Descanso',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerShadowVisible: false,
        }}
      />
    </Stack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'CheckIn':
              iconName = focused ? 'fitness' : 'fitness-outline';
              break;
            case 'Locations':
              iconName = focused ? 'location' : 'location-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#f0f0f0',
          paddingVertical: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ 
          title: 'Inicio',
          headerTitle: 'GymStreak',
        }}
      />
      <Tab.Screen 
        name="CheckIn" 
        component={CheckInScreen}
        options={{ 
          title: 'Check-In',
          headerTitle: 'Registrar Asistencia',
        }}
      />
      <Tab.Screen 
        name="Locations" 
        component={LocationsScreen}
        options={{ 
          title: 'Sedes',
          headerTitle: 'Gimnasios',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStackScreen}
        options={{ 
          title: 'Perfil',
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <RefreshProvider>
        <TabNavigator />
      </RefreshProvider>
    </NavigationContainer>
  );
}