import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { checkAuthStatus } from '../store/slices/authSlice';
import { Ionicons } from '@expo/vector-icons';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main Screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import TestsScreen from '../screens/tests/TestsScreen';
import TestScreen from '../screens/tests/TestScreen';
import TestResultScreen from '../screens/tests/TestResultScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import WordDetailScreen from '../screens/dashboard/WordDetailScreen';
import ProgressScreen from '../screens/profile/ProgressScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import DictionaryScreen from '../screens/dictionary/DictionaryScreen';
import SearchScreen from '../screens/dashboard/SearchScreen';

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Tests: undefined;
  Dictionary: undefined;
  Profile: undefined;
};

export type DashboardStackParamList = {
  DashboardHome: undefined;
  Search: undefined;
  WordDetail: { wordId: number };
};

export type DictionaryStackParamList = {
  DictionaryHome: undefined;
  WordDetail: { wordId: number };
};

export type TestsStackParamList = {
  TestsHome: undefined;
  Test: { testId?: number; testType: 'level_test' | 'daily_practice' | 'review' };
  TestResult: { testId: number };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  Progress: undefined;
  Settings: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const DashboardStack = createNativeStackNavigator<DashboardStackParamList>();
const DictionaryStack = createNativeStackNavigator<DictionaryStackParamList>();
const TestsStack = createNativeStackNavigator<TestsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

// Auth Navigator
function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

// Dashboard Stack Navigator
function DashboardNavigator() {
  return (
    <DashboardStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#6366f1',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <DashboardStack.Screen 
        name="DashboardHome" 
        component={DashboardScreen}
        options={{ title: 'Ana Sayfa' }}
      />
      <DashboardStack.Screen 
        name="Search" 
        component={SearchScreen}
        options={{ title: 'Kelime Ara' }}
      />
      <DashboardStack.Screen 
        name="WordDetail" 
        component={WordDetailScreen}
        options={{ title: 'Kelime Detayı' }}
      />
    </DashboardStack.Navigator>
  );
}

// Dictionary Stack Navigator
function DictionaryNavigator() {
  return (
    <DictionaryStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <DictionaryStack.Screen 
        name="DictionaryHome" 
        component={DictionaryScreen}
        options={{ title: 'Sözlük' }}
      />
      <DictionaryStack.Screen 
        name="WordDetail" 
        component={WordDetailScreen}
        options={{ title: 'Kelime Detayı' }}
      />
    </DictionaryStack.Navigator>
  );
}

// Tests Stack Navigator
function TestsNavigator() {
  return (
    <TestsStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#6366f1',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <TestsStack.Screen 
        name="TestsHome" 
        component={TestsScreen}
        options={{ title: 'Testler' }}
      />
      <TestsStack.Screen 
        name="Test" 
        component={TestScreen}
        options={{ title: 'Test' }}
      />
      <TestsStack.Screen 
        name="TestResult" 
        component={TestResultScreen}
        options={{ title: 'Test Sonucu' }}
      />
    </TestsStack.Navigator>
  );
}

// Profile Stack Navigator
function ProfileNavigator() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#6366f1',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <ProfileStack.Screen 
        name="ProfileHome" 
        component={ProfileScreen}
        options={{ title: 'Profil' }}
      />
      <ProfileStack.Screen 
        name="Progress" 
        component={ProgressScreen}
        options={{ title: 'İlerleme' }}
      />
      <ProfileStack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Ayarlar' }}
      />
    </ProfileStack.Navigator>
  );
}

// Main Tab Navigator
function MainNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Tests') {
            iconName = focused ? 'school' : 'school-outline';
          } else if (route.name === 'Dictionary') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
      })}
    >
      <MainTab.Screen 
        name="Dashboard" 
        component={DashboardNavigator}
        options={{ title: 'Ana Sayfa' }}
      />
      <MainTab.Screen 
        name="Tests" 
        component={TestsNavigator}
        options={{ title: 'Testler' }}
      />
      <MainTab.Screen 
        name="Dictionary" 
        component={DictionaryNavigator}
        options={{ title: 'Sözlük' }}
      />
      <MainTab.Screen 
        name="Profile" 
        component={ProfileNavigator}
        options={{ title: 'Profil' }}
      />
    </MainTab.Navigator>
  );
}

// Root Navigator
export default function AppNavigator() {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Check if user is already logged in when app starts
    dispatch(checkAuthStatus());
  }, [dispatch]);

  if (isLoading) {
    // You can return a loading screen here
    return null;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}