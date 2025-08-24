import React, { useState, useEffect } from 'react';
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
import ProfileScreen from '../screens/profile/ProfileScreen';
import DictionaryScreen from '../screens/dictionary/DictionaryScreen';

type Screen = 'login' | 'register' | 'dashboard' | 'tests' | 'test' | 'dictionary' | 'profile';

export default function SimpleWebNavigator() {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');

  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      setCurrentScreen('dashboard');
    } else {
      setCurrentScreen('login');
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Yükleniyor...
      </div>
    );
  }

  const mockNavigation = {
    navigate: (screen: string, params?: any) => {
      if (screen === 'Register') setCurrentScreen('register');
      if (screen === 'Login') setCurrentScreen('login');
      if (screen === 'Dashboard') setCurrentScreen('dashboard');
      if (screen === 'Test') {
        setCurrentScreen('test');
        // Store test params for TestScreen
        if (params) {
          (window as any).testParams = params;
        }
      }
    }
  };

  const renderAuthScreen = () => {
    switch (currentScreen) {
      case 'login':
        return <LoginScreen navigation={mockNavigation} />;
      case 'register':
        return <RegisterScreen navigation={mockNavigation} />;
      default:
        return <LoginScreen navigation={mockNavigation} />;
    }
  };

  const renderMainScreen = () => {
    return (
      <div style={{ display: 'flex', height: '100vh' }}>
        {/* Navigation Sidebar */}
        <div style={{
          width: '200px',
          backgroundColor: '#f5f5f5',
          padding: '20px',
          borderRight: '1px solid #ddd'
        }}>
          <h2 style={{ marginBottom: '30px', color: '#333' }}>VocabularyApp</h2>
          <nav>
            <button
              onClick={() => setCurrentScreen('dashboard')}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px',
                margin: '5px 0',
                border: 'none',
                backgroundColor: currentScreen === 'dashboard' ? '#007bff' : 'transparent',
                color: currentScreen === 'dashboard' ? 'white' : '#333',
                cursor: 'pointer',
                borderRadius: '4px'
              }}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentScreen('tests')}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px',
                margin: '5px 0',
                border: 'none',
                backgroundColor: currentScreen === 'tests' ? '#007bff' : 'transparent',
                color: currentScreen === 'tests' ? 'white' : '#333',
                cursor: 'pointer',
                borderRadius: '4px'
              }}
            >
              Testler
            </button>
            <button
              onClick={() => setCurrentScreen('dictionary')}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px',
                margin: '5px 0',
                border: 'none',
                backgroundColor: currentScreen === 'dictionary' ? '#007bff' : 'transparent',
                color: currentScreen === 'dictionary' ? 'white' : '#333',
                cursor: 'pointer',
                borderRadius: '4px'
              }}
            >
              Sözlük
            </button>
            <button
              onClick={() => setCurrentScreen('profile')}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px',
                margin: '5px 0',
                border: 'none',
                backgroundColor: currentScreen === 'profile' ? '#007bff' : 'transparent',
                color: currentScreen === 'profile' ? 'white' : '#333',
                cursor: 'pointer',
                borderRadius: '4px'
              }}
            >
              Profil
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
          {currentScreen === 'dashboard' && <DashboardScreen navigation={mockNavigation} />}
          {currentScreen === 'tests' && <TestsScreen navigation={mockNavigation} />}
          {currentScreen === 'test' && <TestScreen navigation={mockNavigation} route={{ params: (window as any).testParams || {} }} />}
          {currentScreen === 'dictionary' && <DictionaryScreen navigation={mockNavigation} />}
          {currentScreen === 'profile' && <ProfileScreen navigation={mockNavigation} />}
        </div>
      </div>
    );
  };

  return (
    <div>
      {isAuthenticated ? renderMainScreen() : renderAuthScreen()}
    </div>
  );
}