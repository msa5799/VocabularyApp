import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  navigation: any;
  route: {
    params: {
      testId: number;
    };
  };
}

const TestResultScreen: React.FC<Props> = ({ navigation, route }) => {
  const { testId } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="trophy-outline" size={48} color="#10b981" />
          <Text style={styles.title}>Test Sonucu</Text>
          <Text style={styles.subtitle}>Test ID: {testId}</Text>
        </View>
        
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Bu ekran test sonuçlarını gösterecek.
            Doğru/yanlış sayısı, puan, seviye önerisi
            ve detaylı analiz burada yer alacak.
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
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
  },
  placeholder: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
  },
  placeholderText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  backButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TestResultScreen;