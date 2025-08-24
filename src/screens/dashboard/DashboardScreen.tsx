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
import { firestoreService } from '../../services/storage/firestore';

interface Props {
  navigation: any;
}

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 768;
const isMobile = width < 480;

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
      dispatch(loadDailyWords({ userId: parseInt(user.id), date: today }));
      dispatch(calculateProgressStats(parseInt(user.id)));
      
      // Load API words
      loadApiDailyWords();
    }
  }, [dispatch, user]);

  const loadApiDailyWords = async () => {
    if (!user) return;
    
    setApiLoading(true);
    try {
      const level = user.current_level || 'A1';
      
      // Kullanıcının öğrendiği kelimeleri al
      let excludeWords: string[] = [];
      if (user.firebase_uid) {
        const userWordLists = await firestoreService.getUserWordListsByFirebaseUid(user.firebase_uid);
        excludeWords = [
          ...userWordLists.learning.map(item => item.word.word),
          ...userWordLists.saved.map(item => item.word.word),
          ...userWordLists.mastered.map(item => item.word.word)
        ];
      }
      
      const words = await realTimeVocabularyAPI.getWordsByLevel(level, 5, excludeWords);
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
      
      // Kullanıcının öğrendiği kelimeleri al
      let excludeWords: string[] = [];
      if (user.firebase_uid) {
        const userWordLists = await firestoreService.getUserWordListsByFirebaseUid(user.firebase_uid);
        excludeWords = [
          ...userWordLists.learning.map(item => item.word.word),
          ...userWordLists.saved.map(item => item.word.word),
          ...userWordLists.mastered.map(item => item.word.word)
        ];
      }
      
      const words = await realTimeVocabularyAPI.getWordsByLevel(level, 10, excludeWords);
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
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={[styles.actionCard, styles.actionCardPrimary]}
            onPress={() => navigation.navigate('WordLearning', { level: user?.current_level })}
          >
            <Ionicons name="library-outline" size={28} color="#fff" />
            <Text style={styles.actionTitle}>Kelime Öğren</Text>
            <Text style={styles.actionSubtitle}>Seviyene göre kelimeler</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionCard, styles.actionCardSecondary]}
            onPress={() => navigateToTest('daily_practice')}
          >
            <Ionicons name="school-outline" size={28} color="#fff" />
            <Text style={styles.actionTitle}>Günlük Pratik</Text>
            <Text style={styles.actionSubtitle}>10 kelime ile pratik</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionCard, styles.actionCardTertiary]}
            onPress={() => navigation.navigate('WordLists')}
          >
            <Ionicons name="list-outline" size={28} color="#fff" />
            <Text style={styles.actionTitle}>Kelime Listem</Text>
            <Text style={styles.actionSubtitle}>Kayıtlı kelimeler</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionCard, styles.actionCardQuaternary]}
            onPress={() => navigateToTest('review')}
          >
            <Ionicons name="refresh-outline" size={28} color="#fff" />
            <Text style={styles.actionTitle}>Tekrar</Text>
            <Text style={styles.actionSubtitle}>Öğrenilen kelimeler</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: '#dc2626' }]}
            onPress={() => navigation.navigate('ProfessionalAssessment', { assessmentType: 'full' })}
          >
            <Ionicons name="analytics-outline" size={28} color="#fff" />
            <Text style={styles.actionTitle}>Profesyonel Test</Text>
            <Text style={styles.actionSubtitle}>Kapsamlı seviye testi</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: '#059669' }]}
            onPress={() => navigation.navigate('ProfessionalAssessment', { assessmentType: 'quick' })}
          >
            <Ionicons name="flash-outline" size={28} color="#fff" />
            <Text style={styles.actionTitle}>Hızlı Değerlendirme</Text>
            <Text style={styles.actionSubtitle}>20 dakikalık test</Text>
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
    padding: isMobile ? 16 : 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingTop: isMobile ? 50 : 20, // Safe area for mobile
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: isMobile ? 8 : 12,
  },
  searchButton: {
    padding: isMobile ? 6 : 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  greeting: {
    fontSize: isMobile ? 14 : 16,
    color: '#6b7280',
  },
  username: {
    fontSize: isMobile ? 20 : 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  levelBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: isMobile ? 8 : 12,
    paddingVertical: isMobile ? 4 : 6,
    borderRadius: 20,
  },
  levelText: {
    fontSize: isMobile ? 14 : 16,
    fontWeight: 'bold',
  },
  statsContainer: {
    padding: isMobile ? 16 : 20,
  },
  statsRow: {
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    marginBottom: isMobile ? 8 : 12,
    gap: isMobile ? 8 : 0,
  },
  statCard: {
    flex: isMobile ? 0 : 1,
    width: isMobile ? '100%' : 'auto',
    backgroundColor: '#fff',
    padding: isMobile ? 12 : 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: isMobile ? 0 : 6,
    boxShadow: '0 2px 3.84px rgba(0, 0, 0, 0.1)',
    elevation: 5,
    flexDirection: isMobile ? 'row' : 'column',
    justifyContent: isMobile ? 'flex-start' : 'center',
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
    fontSize: isMobile ? 20 : 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginVertical: isMobile ? 0 : 4,
    marginLeft: isMobile ? 12 : 0,
  },
  statLabel: {
    fontSize: isMobile ? 11 : 12,
    color: '#6b7280',
    textAlign: isMobile ? 'left' : 'center',
    marginLeft: isMobile ? 12 : 0,
    flex: isMobile ? 1 : 0,
  },
  section: {
    padding: isMobile ? 16 : 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: isMobile ? 18 : 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: isMobile ? 8 : 12,
  },
  actionCard: {
    width: isMobile ? '48%' : '48%',
    minHeight: isMobile ? 100 : 120,
    padding: isMobile ? 12 : 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: isMobile ? 6 : 8,
  },
  actionCardPrimary: {
    backgroundColor: '#6366f1',
  },
  actionCardSecondary: {
    backgroundColor: '#10b981',
  },
  actionCardTertiary: {
    backgroundColor: '#f59e0b',
  },
  actionCardQuaternary: {
    backgroundColor: '#8b5cf6',
  },
  actionTitle: {
    fontSize: isMobile ? 12 : 14,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: isMobile ? 4 : 6,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: isMobile ? 10 : 11,
    color: '#e5e7eb',
    textAlign: 'center',
    marginTop: 2,
  },
  wordCard: {
    backgroundColor: '#fff',
    padding: isMobile ? 12 : 16,
    borderRadius: 12,
    marginRight: isMobile ? 8 : 12,
    width: isMobile ? width * 0.75 : width * 0.55,
    boxShadow: '0 2px 3.84px rgba(0, 0, 0, 0.1)',
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
    fontSize: isMobile ? 16 : 18,
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
    fontSize: isMobile ? 14 : 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  wordType: {
    fontSize: isMobile ? 11 : 12,
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
    fontSize: isMobile ? 14 : 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: isMobile ? 20 : 40,
  },
  emptyText: {
    fontSize: isMobile ? 14 : 16,
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
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