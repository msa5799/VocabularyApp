import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  navigation: any;
}

const TestsScreen: React.FC<Props> = ({ navigation }) => {
  const navigateToTest = (testType: 'level_test' | 'daily_practice' | 'review') => {
    navigation.navigate('Test', { testType });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="school-outline" size={48} color="#6366f1" />
          <Text style={styles.title}>Testler</Text>
          <Text style={styles.subtitle}>Seviyenizi test edin ve pratik yapın</Text>
        </View>
        
        <View style={styles.testOptions}>
          <TouchableOpacity 
            style={[styles.testCard, styles.levelTestCard]}
            onPress={() => navigateToTest('level_test')}
          >
            <Ionicons name="analytics-outline" size={32} color="#fff" />
            <Text style={styles.testTitle}>Seviye Testi</Text>
            <Text style={styles.testDescription}>CEFR seviyenizi belirleyin</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.testCard, styles.practiceCard]}
            onPress={() => navigateToTest('daily_practice')}
          >
            <Ionicons name="fitness-outline" size={32} color="#fff" />
            <Text style={styles.testTitle}>Günlük Pratik</Text>
            <Text style={styles.testDescription}>10 kelime ile pratik yapın</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.testCard, styles.reviewCard]}
            onPress={() => navigateToTest('review')}
          >
            <Ionicons name="refresh-outline" size={32} color="#fff" />
            <Text style={styles.testTitle}>Tekrar</Text>
            <Text style={styles.testDescription}>Öğrenilen kelimeleri tekrarlayın</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  testOptions: {
    gap: 16,
  },
  testCard: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  levelTestCard: {
    backgroundColor: '#6366f1',
  },
  practiceCard: {
    backgroundColor: '#10b981',
  },
  reviewCard: {
    backgroundColor: '#f59e0b',
  },
  testTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  testDescription: {
    fontSize: 14,
    color: '#e5e7eb',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default TestsScreen;