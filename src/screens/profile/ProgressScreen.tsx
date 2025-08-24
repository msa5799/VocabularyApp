import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  navigation: any;
}

const ProgressScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="trending-up-outline" size={48} color="#6366f1" />
          <Text style={styles.title}>İlerleme</Text>
          <Text style={styles.subtitle}>Öğrenme istatistikleriniz</Text>
        </View>
        
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Bu ekran detaylı ilerleme istatistiklerini gösterecek.
            Grafik, başarı oranları, seviye geçmişi ve
            öğrenme analizi burada yer alacak.
          </Text>
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
  },
  placeholder: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default ProgressScreen;