import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import realTimeVocabularyAPI, { SearchResult } from '../../services/api/realTimeVocabularyAPI';

interface Props {
  navigation: any;
}

const DictionaryScreen: React.FC<Props> = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [words, setWords] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSearch = useCallback(async () => {
    if (!query.trim()) {
      setWords([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const results = await realTimeVocabularyAPI.searchWords(query.trim());
      setWords(results);
    } catch (err) {
      setError('Arama sırasında bir hata oluştu');
      setWords([]);
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  const renderItem = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity style={styles.wordItem} onPress={() => navigation.navigate('WordDetail', { word: item.word, isApiWord: true })}>
      <View style={styles.wordHeader}>
        <Text style={styles.wordEnglish}>{item.word}</Text>
        <View style={[styles.levelBadgeSmall, { backgroundColor: getLevelColor(item.cefr_level || 'B1') }]}>
          <Text style={styles.levelTextSmall}>{item.cefr_level || 'B1'}</Text>
        </View>
      </View>
      <Text style={styles.wordTurkish}>{item.definition_tr}</Text>
      {item.part_of_speech ? <Text style={styles.wordType}>{item.part_of_speech}</Text> : null}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6b7280" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Kelime veya anlam ara..."
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          onSubmitEditing={onSearch}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
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

          {words.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="book" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>Arama yapmak için bir kelime yazın</Text>
            </View>
          ) : (
            <FlatList
              data={words}
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
  header: { backgroundColor: '#6366f1', paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginLeft: 8 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 16, paddingHorizontal: 12, borderRadius: 12, height: 44, borderWidth: 1, borderColor: '#e5e7eb' },
  searchInput: { flex: 1, fontSize: 16, color: '#111827' },
  searchButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#6366f1', marginHorizontal: 16, paddingVertical: 12, borderRadius: 12, justifyContent: 'center' },
  searchButtonText: { color: '#fff', fontWeight: '600', marginLeft: 8 },
  loadingContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  loadingText: { marginTop: 8, color: '#6b7280' },
  errorContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', borderColor: '#fecaca', borderWidth: 1, padding: 10, marginHorizontal: 16, borderRadius: 8, marginTop: 12 },
  errorText: { color: '#b91c1c', marginLeft: 8 },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#6b7280', marginTop: 8 },
  wordItem: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  wordHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wordEnglish: { fontSize: 18, fontWeight: '700', color: '#111827' },
  wordTurkish: { marginTop: 6, color: '#374151' },
  wordType: { marginTop: 4, color: '#6b7280', fontStyle: 'italic' },
  levelBadgeSmall: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  levelTextSmall: { color: '#fff', fontWeight: '700' },
});

export default DictionaryScreen;