import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './src/store';
import WebAppNavigator from './src/navigation/WebAppNavigator';
import { databaseService } from './src/services/storage/database';
// webStorageService removed - using Firestore only

// Import CSS for web platform
if (Platform.OS === 'web') {
  require('./assets/styles.css');
}

export default function App() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Using database service for all platforms
        await databaseService.initializeDatabase();
        console.log('App initialized successfully');
      } catch (error) {
        console.error('App initialization failed:', error);
      }
    };

    initializeApp();
  }, []);

  return (
    <Provider store={store}>
      <StatusBar style="auto" />
      <WebAppNavigator />
    </Provider>
  );
}
