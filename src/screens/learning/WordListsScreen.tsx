import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  TextInput,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { Ionicons } from '@expo/vector-icons';
import { SearchResult } from '../../services/api/realTimeVocabularyAPI';
import { firestoreService } from '../../services/storage/firestore';

// UserWordListItem interface for Firebase
interface UserWordListItem {
  id: string;
  user_id: number;
  word: any;
  list_type: 'learning' | 'saved' | 'mastered';
  added_at: string;
  review_count: number;
  last_reviewed?: string;
  created_at: string;
  updated_at: string;
}

interface Props {
  navigation: any;
}

type ListType = 'learning' | 'saved' | 'mastered';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 768;
const isMobile = width < 480;

const WordListsScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState<ListType>('learning');
  const [searchQuery, setSearchQuery] = useState('');
  const [wordLists, setWordLists] = useState<{
    learning: UserWordListItem[];
    saved: UserWordListItem[];
    mastered: UserWordListItem[];
  }>({
    learning: [],
    saved: [],
    mastered: []
  });

  useEffect(() => {
    loadWordLists();
  }, [user]);

  const loadWordLists = async () => {
    if (!user) return;
    
    try {
      if (!user?.firebase_uid) {
        Alert.alert('Hata', 'Kullanıcı oturumu bulunamadı.');
        return;
      }
      const userWordLists = await firestoreService.getUserWordListsByFirebaseUid(user.firebase_uid);
      setWordLists(userWordLists);
    } catch (error) {
      console.error('Error loading word lists:', error);
      Alert.alert('Hata', 'Kelime listeleri yüklenirken bir hata oluştu.');
    }
  };

  const removeWordFromList = (wordId: string, listType: ListType) => {
    if (!user) return;
    
    Alert.alert(
      'Kelimeyi Sil',
      'Bu kelimeyi listeden kaldırmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!user?.firebase_uid) {
                Alert.alert('Hata', 'Kullanıcı oturumu bulunamadı.');
                return;
              }
              await firestoreService.removeWordFromList(0, wordId); // userId not used in this method
              loadWordLists(); // Reload the lists
            } catch (error) {
              console.error('Error removing word:', error);
              Alert.alert('Hata', 'Kelime silinirken bir hata oluştu.');
            }
          }
        }
      ]
    );
  };

  const moveWordToMastered = async (wordId: string, fromList: ListType) => {
    if (!user) return;
    
    try {
      if (!user?.firebase_uid) {
        Alert.alert('Hata', 'Kullanıcı oturumu bulunamadı.');
        return;
      }
      await firestoreService.moveWordToList(0, wordId, 'mastered'); // userId not used in this method
      loadWordLists(); // Reload the lists
    } catch (error) {
      console.error('Error moving word to mastered:', error);
      Alert.alert('Hata', 'Kelime taşınırken bir hata oluştu.');
    }
  };

  const moveWordToLearning = async (wordId: string) => {
    if (!user) return;
    
    try {
      if (!user?.firebase_uid) {
        Alert.alert('Hata', 'Kullanıcı oturumu bulunamadı.');
        return;
      }
      await firestoreService.moveWordToList(0, wordId, 'learning'); // userId not used in this method
      loadWordLists(); // Reload the lists
    } catch (error) {
      console.error('Error moving word to learning:', error);
      Alert.alert('Hata', 'Kelime taşınırken bir hata oluştu.');
    }
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

  const getTabTitle = (tab: ListType) => {
    const titles = {
      learning: 'Öğreniyorum',
      saved: 'Kaydedilenler',
      mastered: 'Öğrendiklerim'
    };
    return titles[tab];
  };

  const getTabCount = (tab: ListType) => {
    return wordLists[tab].length;
  };

  const filteredWords = wordLists[activeTab].filter(item => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.word?.word?.toLowerCase().includes(query) ||
      item.word?.definition_tr?.toLowerCase().includes(query)
    );
  });

  const renderWordItem = ({ item }: { item: UserWordListItem }) => (
    <View style={styles.wordItem}>
      <TouchableOpacity 
        style={styles.wordContent}
        onPress={() => navigation.navigate('WordDetail', { 
          word: item.word.word, 
          isApiWord: true 
        })}
      >
        <View style={styles.wordHeader}>
          <Text style={styles.wordEnglish}>{item.word.word}</Text>
          <View style={[styles.levelBadge, { backgroundColor: getLevelColor(item.word.cefr_level || 'B1') }]}>
            <Text style={styles.levelText}>{item.word.cefr_level || 'B1'}</Text>
          </View>
        </View>
        
        <Text style={styles.wordTurkish}>{item.word.definition_tr}</Text>
        
        {item.word.part_of_speech && (
          <Text style={styles.wordType}>{item.word.part_of_speech}</Text>
        )}
        
        <View style={styles.wordMeta}>
          <Text style={styles.addedDate}>
            Eklenme: {new Date(item.added_at).toLocaleDateString('tr-TR')}
          </Text>
          {item.review_count > 0 && (
            <Text style={styles.reviewCount}>
              {item.review_count} kez tekrarlandı
            </Text>
          )}
        </View>
      </TouchableOpacity>
      
      <View style={styles.wordActions}>
        {activeTab === 'saved' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.learnButton]}
            onPress={() => moveWordToLearning(item.id)}
          >
            <Ionicons name="school-outline" size={20} color="#fff" />
          </TouchableOpacity>
        )}
        
        {(activeTab === 'learning' || activeTab === 'saved') && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.masteredButton]}
            onPress={() => moveWordToMastered(item.id, activeTab)}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => removeWordFromList(item.id, activeTab)}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kelime Listelerim</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Search')}>
          <Ionicons name="add" size={24} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Kelime ara..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {(['learning', 'saved', 'mastered'] as ListType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {getTabTitle(tab)}
            </Text>
            <View style={[styles.tabBadge, activeTab === tab && styles.activeTabBadge]}>
              <Text style={[styles.tabBadgeText, activeTab === tab && styles.activeTabBadgeText]}>
                {getTabCount(tab)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Word List */}
      <View style={styles.listContainer}>
        {filteredWords.length > 0 ? (
          <FlatList
            data={filteredWords}
            renderItem={renderWordItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name={activeTab === 'learning' ? 'school-outline' : 
                   activeTab === 'saved' ? 'bookmark-outline' : 'checkmark-circle-outline'} 
              size={64} 
              color="#9ca3af" 
            />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'Kelime bulunamadı' : 
               activeTab === 'learning' ? 'Henüz öğrendiğiniz kelime yok' :
               activeTab === 'saved' ? 'Henüz kaydettiğiniz kelime yok' :
               'Henüz öğrendiğiniz kelime yok'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Farklı bir arama terimi deneyin' :
               activeTab === 'learning' ? 'Kelime öğrenme bölümünden başlayın' :
               activeTab === 'saved' ? 'Sözlükten kelime kaydedin' :
               'Kelimeleri öğrendikçe burada görünecek'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => navigation.navigate(activeTab === 'saved' ? 'Search' : 'WordLearning')}
              >
                <Text style={styles.emptyButtonText}>
                  {activeTab === 'saved' ? 'Kelime Ara' : 'Öğrenmeye Başla'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
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
  headerTitle: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  searchContainer: {
    padding: isMobile ? 12 : 16,
    backgroundColor: '#fff',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: isMobile ? 8 : 12,
    paddingHorizontal: isMobile ? 8 : 12,
    paddingVertical: isMobile ? 6 : 8,
    gap: isMobile ? 6 : 8,
  },
  searchInput: {
    flex: 1,
    fontSize: isMobile ? 14 : 16,
    color: '#1f2937',
    paddingVertical: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isMobile ? 12 : 16,
    paddingHorizontal: isMobile ? 8 : 12,
    gap: isMobile ? 6 : 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontSize: isMobile ? 12 : 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#6366f1',
  },
  tabBadge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: isMobile ? 6 : 8,
    paddingVertical: 2,
    borderRadius: isMobile ? 8 : 10,
    minWidth: isMobile ? 18 : 20,
    alignItems: 'center',
  },
  activeTabBadge: {
    backgroundColor: '#6366f1',
  },
  tabBadgeText: {
    fontSize: isMobile ? 10 : 12,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  activeTabBadgeText: {
    color: '#fff',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: isMobile ? 12 : 16,
  },
  wordItem: {
    flexDirection: isMobile ? 'column' : 'row',
    backgroundColor: '#fff',
    borderRadius: isMobile ? 8 : 12,
    marginBottom: isMobile ? 8 : 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  wordContent: {
    flex: 1,
    padding: isMobile ? 12 : 16,
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isMobile ? 6 : 8,
  },
  wordEnglish: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  levelBadge: {
    paddingHorizontal: isMobile ? 6 : 8,
    paddingVertical: isMobile ? 3 : 4,
    borderRadius: isMobile ? 8 : 12,
  },
  levelText: {
    fontSize: isMobile ? 10 : 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  wordTurkish: {
    fontSize: isMobile ? 14 : 16,
    color: '#374151',
    marginBottom: 4,
  },
  wordType: {
    fontSize: isMobile ? 12 : 14,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: isMobile ? 6 : 8,
  },
  wordMeta: {
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'flex-start' : 'center',
    gap: isMobile ? 4 : 0,
  },
  addedDate: {
    fontSize: isMobile ? 11 : 12,
    color: '#9ca3af',
  },
  reviewCount: {
    fontSize: isMobile ? 11 : 12,
    color: '#6366f1',
    fontWeight: '600',
  },
  wordActions: {
    flexDirection: isMobile ? 'row' : 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: isMobile ? 12 : 12,
    paddingVertical: isMobile ? 8 : 0,
    gap: isMobile ? 8 : 8,
    borderTopWidth: isMobile ? 1 : 0,
    borderTopColor: isMobile ? '#e5e7eb' : 'transparent',
  },
  actionButton: {
    width: isMobile ? 32 : 36,
    height: isMobile ? 32 : 36,
    borderRadius: isMobile ? 16 : 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  learnButton: {
    backgroundColor: '#6366f1',
  },
  masteredButton: {
    backgroundColor: '#10b981',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: isMobile ? 24 : 40,
  },
  emptyTitle: {
    fontSize: isMobile ? 18 : 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: isMobile ? 12 : 16,
    marginBottom: isMobile ? 6 : 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: isMobile ? 14 : 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: isMobile ? 20 : 24,
    marginBottom: isMobile ? 20 : 24,
  },
  emptyButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: isMobile ? 20 : 24,
    paddingVertical: isMobile ? 10 : 12,
    borderRadius: isMobile ? 8 : 12,
  },
  emptyButtonText: {
    fontSize: isMobile ? 14 : 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default WordListsScreen;