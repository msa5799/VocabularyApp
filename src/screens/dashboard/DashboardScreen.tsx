import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { loadDailyWords, generateDailyWords } from '../../store/slices/wordsSlice';
import { calculateProgressStats } from '../../store/slices/progressSlice';
import { Ionicons } from '@expo/vector-icons';
import realTimeVocabularyAPI, { SearchResult } from '../../services/api/realTimeVocabularyAPI';

interface Props {
  navigation: any;
}

const { width } = Dimensions.get('window');

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { dailyWords, isLoading: wordsLoading } = useSelector((state: RootState) => state.words);
  const { stats, isLoading: progressLoading } = useSelector((state: RootState) => state.progress);
  
  const [apiDailyWords, setApiDailyWords] = useState<SearchResult[]>([]);
  const [apiLoading, setApiLoading] = useState(false);

  useEffect(() => {
    if (user) {
      // Load daily words and stats
      const today = new Date().toISOString().split('T')[0];
      dispatch(loadDailyWords({ userId: user.id, date: today }));
      dispatch(calculateProgressStats(user.id));
      
      // Load API words
      loadApiDailyWords();
    }
  }, [dispatch, user]);

  const loadApiDailyWords = async () => {
    if (!user) return;
    
    setApiLoading(true);
    try {
      const level = user.current_level || 'A1';
      const words = await realTimeVocabularyAPI.getWordsByLevel(level, 5);
      setApiDailyWords(words);
    } catch (error) {
      console.error('Error loading API daily words:', error);
    } finally {
      setApiLoading(false);
    }
  };

  const generateApiDailyWords = async () => {
    if (!user) return;
    
    setApiLoading(true);
    try {
      const level = user.current_level || 'A1';
      const words = await realTimeVocabularyAPI.getWordsByLevel(level, 10);
      setApiDailyWords(words);
    } catch (error) {
      console.error('Error generating API daily words:', error);
    } finally {
      setApiLoading(false);
    }
  };

  const navigateToTest = (testType: 'level_test' | 'daily_practice' | 'review') => {
    navigation.navigate('Tests', {
      screen: 'Test',
      params: { testType }
    });
  };

  const navigateToWordDetail = (word: string) => {
    navigation.navigate('WordDetail', { word: word, isApiWord: true });
  };

  const getLevelColor = (level: string) => {
    const colors: { [key: string]: string } = {
      'A1': '#10b981',
      'A2': '#3b82f6',
      'B1': '#f59e0b',
      'B2': '#ef4444',
      'C1': '#8b5cf6',
      'C2': '#6b7280',
    };
    return colors[level] || '#6b7280';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi öğleden sonra';
    return 'İyi akşamlar';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.username}>{user?.username || 'Kullanıcı'}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={() => navigation.navigate('Search')}
          >
            <Ionicons name="search-outline" size={24} color="#6366f1" />
          </TouchableOpacity>
          <View style={styles.levelBadge}>
            <Text style={[styles.levelText, { color: getLevelColor(user?.current_level || 'A1') }]}>
              {user?.current_level || 'A1'}
            </Text>
          </View>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardPrimary]}>
            <Ionicons name="book-outline" size={24} color="#6366f1" />
            <Text style={styles.statNumber}>{stats.totalWords}</Text>
            <Text style={styles.statLabel}>Toplam Kelime</Text>
          </View>
          <View style={[styles.statCard, styles.statCardSuccess]}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#10b981" />
            <Text style={styles.statNumber}>{stats.masteredWords}</Text>
            <Text style={styles.statLabel}>Öğrenilen</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardWarning]}>
            <Ionicons name="trending-up-outline" size={24} color="#f59e0b" />
            <Text style={styles.statNumber}>{stats.accuracyRate.toFixed(1)}%</Text>
            <Text style={styles.statLabel}>Başarı Oranı</Text>
          </View>
          <View style={[styles.statCard, styles.statCardInfo]}>
            <Ionicons name="flame-outline" size={24} color="#ef4444" />
            <Text style={styles.statNumber}>{stats.streakDays}</Text>
            <Text style={styles.statLabel}>Seri Gün</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionCard, styles.actionCardPrimary]}
            onPress={() => navigateToTest('daily_practice')}
          >
            <Ionicons name="school-outline" size={32} color="#fff" />
            <Text style={styles.actionTitle}>Günlük Pratik</Text>
            <Text style={styles.actionSubtitle}>10 kelime ile pratik yap</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionCard, styles.actionCardSecondary]}
            onPress={() => navigateToTest('review')}
          >
            <Ionicons name="refresh-outline" size={32} color="#fff" />
            <Text style={styles.actionTitle}>Tekrar</Text>
            <Text style={styles.actionSubtitle}>Öğrenilen kelimeleri tekrarla</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Daily Words */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Günün Kelimeleri</Text>
          <TouchableOpacity onPress={generateApiDailyWords}>
            <Ionicons name="refresh-outline" size={20} color="#6366f1" />
          </TouchableOpacity>
        </View>
        
        {/* API Words Section */}
        {apiLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Gerçek zamanlı kelimeler yükleniyor...</Text>
          </View>
        ) : apiDailyWords.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {apiDailyWords.slice(0, 5).map((word: SearchResult, index: number) => (
              <TouchableOpacity
                key={`api-${word.word}-${index}`}
                style={styles.wordCard}
                onPress={() => navigateToWordDetail(word.word)}
              >
                <View style={styles.wordHeader}>
                  <Text style={styles.wordEnglish}>{word.word}</Text>
                  <View style={[styles.levelBadgeSmall, { backgroundColor: getLevelColor(word.cefr_level || 'B1') }]}>
                    <Text style={styles.levelTextSmall}>{word.cefr_level || 'B1'}</Text>
                  </View>
                </View>
                <Text style={styles.wordTurkish}>{word.definition_tr}</Text>
                <Text style={styles.wordType}>{word.part_of_speech || 'noun'}</Text>
                <View style={styles.apiBadge}>
                  <Ionicons name="globe-outline" size={12} color="#6366f1" />
                  <Text style={styles.apiBadgeText}>API</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="globe-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>Gerçek zamanlı kelimeler yüklenemedi</Text>
            <TouchableOpacity 
              style={styles.generateButton}
              onPress={generateApiDailyWords}
              disabled={apiLoading}
            >
              <Text style={styles.generateButtonText}>
                {apiLoading ? 'Yükleniyor...' : 'API Kelimeleri Yükle'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  greeting: {
    fontSize: 16,
    color: '#6b7280',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  levelBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  levelText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsContainer: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statCardPrimary: {
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  statCardSuccess: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  statCardWarning: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  statCardInfo: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  actionCardPrimary: {
    backgroundColor: '#6366f1',
  },
  actionCardSecondary: {
    backgroundColor: '#10b981',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#e5e7eb',
    textAlign: 'center',
    marginTop: 4,
  },
  wordCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    width: width * 0.7,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'relative',
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  wordEnglish: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  levelBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelTextSmall: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  wordTurkish: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  wordType: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  completedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 16,
  },
  generateButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  generateButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  apiBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  apiBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6366f1',
    marginLeft: 2,
  },
});

export default DashboardScreen;