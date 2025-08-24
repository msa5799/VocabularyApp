import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import realTimeVocabularyAPI, { SearchResult } from '../../services/api/realTimeVocabularyAPI';
import { firestoreService } from '../../services/storage/firestore';
import Toast from '../../components/Toast';

interface Props {
  navigation: any;
}

// Get screen dimensions outside component for StyleSheet
const { width } = Dimensions.get('window');
const isSmallScreen = width < 768;
const isMobile = width < 480;

const DictionaryScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({ visible: false, message: '', type: 'success' });

  const onSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const results = await realTimeVocabularyAPI.searchWords(searchQuery.trim());
      setSearchResults(results);
    } catch (err) {
      setError('Arama sırasında bir hata oluştu');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  const saveWord = async (word: SearchResult, listType: 'learning' | 'saved') => {
    console.log('saveWord called with:', { word: word.word, listType, user });
    
    if (!user) {
      console.log('No user found');
      Alert.alert('Hata', 'Kullanıcı oturumu bulunamadı.');
      return;
    }
    
    if (!user.firebase_uid) {
      console.log('No firebase_uid found for user:', user);
      Alert.alert('Hata', 'Firebase kullanıcı kimliği bulunamadı. Lütfen tekrar giriş yapın.');
      return;
    }

    try {
      console.log('Attempting to save word with firebase_uid:', user.firebase_uid);
      await firestoreService.addWordToListByFirebaseUid(user.firebase_uid, listType, {
        word: word.word,
        definition: word.definition_en,
        type: word.part_of_speech || '',
        example: word.example_en || '',
        level: word.cefr_level || 'A1'
      });
      
      console.log('Word saved successfully');
      setToast({
        visible: true,
        message: `"${word.word}" kelimesi ${listType === 'saved' ? 'kaydedildi' : 'öğrenme listesine eklendi'}!`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error saving word:', error);
      setToast({
        visible: true,
        message: 'Kelime kaydedilirken bir hata oluştu.',
        type: 'error'
      });
    }
  };

  const renderItem = ({ item }: { item: SearchResult }) => (
    <View style={styles.wordItem}>
      <TouchableOpacity onPress={() => navigation.navigate('WordDetail', { word: item.word, isApiWord: true })}>
        <View style={styles.wordHeader}>
          <Text style={styles.wordEnglish}>{item.word}</Text>
          <View style={[styles.levelBadgeSmall, { backgroundColor: getLevelColor(item.cefr_level || 'B1') }]}>
            <Text style={styles.levelTextSmall}>{item.cefr_level || 'B1'}</Text>
          </View>
        </View>
        <Text style={styles.wordTurkish}>{item.definition_tr}</Text>
        {item.part_of_speech ? <Text style={styles.wordType}>{item.part_of_speech}</Text> : null}
      </TouchableOpacity>
      <View style={styles.wordActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.learnButton]} 
          onPress={() => saveWord(item, 'learning')}
        >
          <Ionicons name="school-outline" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Öğren</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.saveButton]} 
          onPress={() => saveWord(item, 'saved')}
        >
          <Ionicons name="bookmark-outline" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Kaydet</Text>
        </TouchableOpacity>
      </View>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </View>
  );

  return (
    <View style={styles.container}>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6b7280" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Kelime veya anlam ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          onSubmitEditing={onSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.searchButton} onPress={onSearch}>
        <Ionicons name="search" size={18} color="#fff" />
        <Text style={styles.searchButtonText}>Ara</Text>
      </TouchableOpacity>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Aranıyor...</Text>
        </View>
      ) : (
        <>
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={18} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {searchResults.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="book" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>Arama yapmak için bir kelime yazın</Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item, index) => `${item.word}-${index}`}
              renderItem={renderItem}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            />
          )}
        </>
      )}
    </View>
  );
};

function getLevelColor(level: string) {
  const map: any = { A1: '#34d399', A2: '#10b981', B1: '#60a5fa', B2: '#3b82f6', C1: '#f59e0b', C2: '#ef4444' };
  return map[level] || '#6b7280';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#6366f1', paddingTop: isMobile ? 50 : 52, paddingBottom: isMobile ? 12 : 16, paddingHorizontal: isMobile ? 12 : 16, flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: isMobile ? 18 : 20, fontWeight: 'bold', marginLeft: isMobile ? 6 : 8 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: isMobile ? 12 : 16, paddingHorizontal: isMobile ? 10 : 12, borderRadius: isMobile ? 8 : 12, height: isMobile ? 40 : 44, borderWidth: 1, borderColor: '#e5e7eb' },
  searchInput: { flex: 1, fontSize: isMobile ? 14 : 16, color: '#111827' },
  searchButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#6366f1', marginHorizontal: isMobile ? 12 : 16, paddingVertical: isMobile ? 10 : 12, borderRadius: isMobile ? 8 : 12, justifyContent: 'center' },
  searchButtonText: { color: '#fff', fontWeight: '600', marginLeft: isMobile ? 6 : 8, fontSize: isMobile ? 14 : 16 },
  loadingContainer: { alignItems: 'center', justifyContent: 'center', marginTop: isMobile ? 20 : 24 },
  loadingText: { marginTop: isMobile ? 6 : 8, color: '#6b7280', fontSize: isMobile ? 14 : 16 },
  errorContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', borderColor: '#fecaca', borderWidth: 1, padding: isMobile ? 8 : 10, marginHorizontal: isMobile ? 12 : 16, borderRadius: isMobile ? 6 : 8, marginTop: isMobile ? 10 : 12 },
  errorText: { color: '#b91c1c', marginLeft: isMobile ? 6 : 8, fontSize: isMobile ? 14 : 16 },
  emptyContainer: { alignItems: 'center', marginTop: isMobile ? 32 : 40 },
  emptyText: { color: '#6b7280', marginTop: isMobile ? 6 : 8, fontSize: isMobile ? 14 : 16 },
  wordItem: { backgroundColor: '#fff', borderRadius: isMobile ? 8 : 12, padding: isMobile ? 12 : 16, marginTop: isMobile ? 8 : 12, borderWidth: 1, borderColor: '#e5e7eb' },
  wordHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wordEnglish: { fontSize: isMobile ? 16 : 18, fontWeight: '700', color: '#111827' },
  wordTurkish: { marginTop: isMobile ? 4 : 6, color: '#374151', fontSize: isMobile ? 14 : 16 },
  wordType: { marginTop: 4, color: '#6b7280', fontStyle: 'italic', fontSize: isMobile ? 12 : 14 },
  levelBadgeSmall: { paddingHorizontal: isMobile ? 6 : 8, paddingVertical: isMobile ? 3 : 4, borderRadius: isMobile ? 6 : 8 },
  levelTextSmall: { color: '#fff', fontWeight: '700', fontSize: isMobile ? 10 : 12 },
  wordActions: {
    flexDirection: 'row',
    marginTop: isMobile ? 10 : 12,
    gap: isMobile ? 6 : 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isMobile ? 6 : 8,
    paddingHorizontal: isMobile ? 8 : 12,
    borderRadius: isMobile ? 6 : 8,
    gap: isMobile ? 3 : 4,
  },
  learnButton: {
    backgroundColor: '#10b981',
  },
  saveButton: {
    backgroundColor: '#6366f1',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: isMobile ? 10 : 12,
    fontWeight: '600',
  },
});

export default DictionaryScreen;