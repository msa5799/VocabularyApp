import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as SQLite from 'expo-sqlite';

export default function TestApp() {
  const [status, setStatus] = useState('Initializing...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testDatabase = async () => {
      try {
        console.log('Testing SQLite...');
        setStatus('Opening database...');
        
        const db = await SQLite.openDatabaseAsync('test.db');
        console.log('Database opened successfully');
        setStatus('Database opened successfully');
        
        await db.execAsync('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT);');
        console.log('Table created successfully');
        setStatus('Table created successfully');
        
        await db.execAsync('INSERT INTO test (name) VALUES ("Hello World");');
        console.log('Data inserted successfully');
        setStatus('Data inserted successfully');
        
        const result = await db.getAllAsync('SELECT * FROM test;');
        console.log('Query result:', result);
        setStatus(`Query successful. Found ${result.length} rows`);
        
      } catch (err) {
        console.error('Database test failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setStatus('Database test failed');
      }
    };

    testDatabase();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SQLite Test</Text>
      <Text style={styles.status}>Status: {status}</Text>
      {error && <Text style={styles.error}>Error: {error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  status: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  error: {
    fontSize: 14,
    color: 'red',
    textAlign: 'center',
  },
});