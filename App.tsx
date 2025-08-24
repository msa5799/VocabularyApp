import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './src/store';
import SimpleWebNavigator from './src/navigation/SimpleWebNavigator';
import { databaseService } from './src/services/storage/database';
import { webStorageService } from './src/services/storage/webStorage';

export default function App() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        if (Platform.OS === 'web') {
          await webStorageService.initializeDatabase();
        } else {
          await databaseService.initializeDatabase();
        }
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
      <SimpleWebNavigator />
    </Provider>
  );
}
