import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { checkAuthStatus } from '../store/slices/authSlice';

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
import WordLearningScreen from '../screens/learning/WordLearningScreen';
import WordListsScreen from '../screens/learning/WordListsScreen';
import ProfessionalAssessmentScreen from '../screens/assessment/ProfessionalAssessmentScreen';

// Web Navigation Component
import WebNavbar from '../components/WebNavbar';
import { CEFRLevel } from '../types/database';

type Screen = 'login' | 'register' | 'dashboard' | 'tests' | 'test' | 'testResult' | 'dictionary' | 'profile' | 'wordDetail' | 'search' | 'progress' | 'settings' | 'wordLearning' | 'wordLists' | 'professionalAssessment';

interface NavigationParams {
  testType?: 'level_test' | 'daily_practice' | 'review';
  testId?: number;
  wordId?: number;
  level?: string;
  word?: string;
  isApiWord?: boolean;
  assessmentType?: 'full' | 'quick' | 'adaptive';
  targetLevel?: CEFRLevel;
}

export default function WebAppNavigator() {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [navigationParams, setNavigationParams] = useState<NavigationParams>({});

  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  useEffect(() => {
    if (!isAuthenticated && !isLoading && currentScreen !== 'register') {
      setCurrentScreen('login');
    } else if (isAuthenticated && (currentScreen === 'login' || currentScreen === 'register')) {
      setCurrentScreen('dashboard');
    }
  }, [isAuthenticated, isLoading, currentScreen]);

  const mockNavigation = {
    navigate: (screen: string, params?: any) => {
      switch (screen) {
        case 'Register':
          setCurrentScreen('register');
          break;
        case 'Login':
          setCurrentScreen('login');
          break;
        case 'Dashboard':
          setCurrentScreen('dashboard');
          break;
        case 'Test':
          setCurrentScreen('test');
          setNavigationParams(params || {});
          break;
        case 'TestResult':
          setCurrentScreen('testResult');
          setNavigationParams(params || {});
          break;
        case 'Tests':
          setCurrentScreen('tests');
          break;
        case 'Dictionary':
          setCurrentScreen('dictionary');
          break;
        case 'Profile':
          setCurrentScreen('profile');
          break;
        case 'WordDetail':
          setCurrentScreen('wordDetail');
          setNavigationParams(params || {});
          break;
        case 'Search':
          setCurrentScreen('search');
          break;
        case 'Progress':
          setCurrentScreen('progress');
          break;
        case 'Settings':
          setCurrentScreen('settings');
          break;
        case 'WordLearning':
          setCurrentScreen('wordLearning');
          setNavigationParams(params || {});
          break;
        case 'WordLists':
          setCurrentScreen('wordLists');
          setNavigationParams(params || {});
          break;
        case 'ProfessionalAssessment':
          setCurrentScreen('professionalAssessment');
          setNavigationParams(params || {});
          break;
        default:
          console.warn('Unknown screen:', screen);
      }
    },
    goBack: () => {
      // Simple back navigation - go to dashboard for main screens
      if (['test', 'testResult'].includes(currentScreen)) {
        setCurrentScreen('tests');
      } else if (['wordDetail', 'search', 'wordLearning', 'wordLists', 'professionalAssessment'].includes(currentScreen)) {
        setCurrentScreen('dashboard');
      } else if (['progress', 'settings'].includes(currentScreen)) {
        setCurrentScreen('profile');
      } else {
        setCurrentScreen('dashboard');
      }
    }
  };

  if (isLoading) {
    return <View style={styles.container} />;
  }

  const renderScreen = () => {
    const screenProps = {
      navigation: mockNavigation,
      route: { params: navigationParams }
    };

    switch (currentScreen) {
      case 'login':
        return <LoginScreen {...screenProps} />;
      case 'register':
        return <RegisterScreen {...screenProps} />;
      case 'dashboard':
        return <DashboardScreen {...screenProps} />;
      case 'tests':
        return <TestsScreen {...screenProps} />;
      case 'test':
        return <TestScreen navigation={mockNavigation} route={{ params: { testType: navigationParams.testType || 'level_test' } }} />;
      case 'testResult':
        return <TestResultScreen navigation={mockNavigation} route={{ params: { testId: navigationParams.testId || 0 } }} />;
      case 'dictionary':
        return <DictionaryScreen {...screenProps} />;
      case 'profile':
        return <ProfileScreen {...screenProps} />;
      case 'wordDetail':
        return <WordDetailScreen {...screenProps} />;
      case 'search':
        return <SearchScreen {...screenProps} />;
      case 'progress':
        return <ProgressScreen {...screenProps} />;
      case 'settings':
        return <SettingsScreen {...screenProps} />;
      case 'wordLearning':
        return <WordLearningScreen {...screenProps} />;
      case 'wordLists':
        return <WordListsScreen {...screenProps} />;
      case 'professionalAssessment':
        return <ProfessionalAssessmentScreen {...screenProps} />;
      default:
        return <DashboardScreen {...screenProps} />;
    }
  };

  return (
    <View style={styles.container}>
      {isAuthenticated && (
        <WebNavbar 
          currentScreen={currentScreen} 
          onNavigate={(screen: string) => mockNavigation.navigate(screen)}
        />
      )}
      <View style={styles.content}>
        {renderScreen()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
});