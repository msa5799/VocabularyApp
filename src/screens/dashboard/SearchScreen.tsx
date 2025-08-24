import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import realTimeVocabularyAPI, { SearchResult } from '../../services/api/realTimeVocabularyAPI';

interface Props {
  navigation: any;
}



type FilterType = 'all' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
type SortType = 'alphabetical' | 'frequency' | 'level';

const SearchScreen: React.FC<Props> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [apiResults, setApiResults] = useState<SearchResult[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [selectedSort, setSelectedSort] = useState<SortType>('alphabetical');
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const filterOptions: FilterType[] = ['all', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const sortOptions: { key: SortType; label: string }[] = [
    { key: 'alphabetical', label: 'Alfabetik' },
    { key: 'frequency', label: 'Sıklık' },
    { key: 'level', label: 'Seviye' },
  ];

  useEffect(() => {
    performSearch();
  }, [searchQuery, selectedFilter, selectedSort]);

  const performSearch = async () => {
    setIsLoading(true);
    
    try {
      if (searchQuery.trim()) {
        // API Search
        const apiSearchResults = await realTimeVocabularyAPI.searchWords(searchQuery, 50);
        let results = apiSearchResults;

        // Apply level filter for API results
        if (selectedFilter !== 'all') {
          results = results.filter(word => word.cefr_level === selectedFilter);
        }

        // Apply sorting for API results with exact match priority
        const searchTerm = searchQuery.trim().toLowerCase();
        
        results.sort((a, b) => {
          // First priority: Exact match
          const aExactMatch = a.word.toLowerCase() === searchTerm;
          const bExactMatch = b.word.toLowerCase() === searchTerm;
          
          if (aExactMatch && !bExactMatch) return -1;
          if (!aExactMatch && bExactMatch) return 1;
          
          // Second priority: Starts with search term
          const aStartsWith = a.word.toLowerCase().startsWith(searchTerm);
          const bStartsWith = b.word.toLowerCase().startsWith(searchTerm);
          
          if (aStartsWith && !bStartsWith) return -1;
          if (!aStartsWith && bStartsWith) return 1;
          
          // Third priority: Selected sort method
          switch (selectedSort) {
            case 'alphabetical':
              return a.word.localeCompare(b.word);
            case 'frequency':
              return (a.frequency_rank || 999999) - (b.frequency_rank || 999999);
            case 'level':
              const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
              const aIndex = levelOrder.indexOf(a.cefr_level || 'B1');
              const bIndex = levelOrder.indexOf(b.cefr_level || 'B1');
              return aIndex - bIndex;
            default:
              return a.word.localeCompare(b.word);
          }
        });

        setApiResults(results);
      } else {
        setApiResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setApiResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWordPress = (word: SearchResult) => {
    navigation.navigate('WordDetail', { 
      word: word.word, 
      isApiWord: true 
    });
  };

  const renderWordItem = ({ item }: { item: SearchResult }) => {
    const cefr_level = item.cefr_level || 'B1';
    const definition = item.definition_tr;
    const example = item.example_en;
    const partOfSpeech = item.part_of_speech;
    
    return (
      <TouchableOpacity style={styles.wordItem} onPress={() => handleWordPress(item)}>
        <View style={styles.wordHeader}>
          <Text style={styles.wordText}>{item.word}</Text>
          <View style={styles.wordMeta}>
            <View style={[styles.levelBadge, { backgroundColor: getLevelColor(cefr_level) }]}>
              <Text style={styles.levelText}>{cefr_level}</Text>
            </View>
            <View style={styles.apiBadge}>
              <Ionicons name="globe-outline" size={12} color="#6366f1" />
              <Text style={styles.apiBadgeText}>API</Text>
            </View>
            {partOfSpeech && (
              <Text style={styles.partOfSpeech}>{partOfSpeech}</Text>
            )}
          </View>
        </View>
        <Text style={styles.definitionText} numberOfLines={2}>
          {definition}
        </Text>
        {example && (
          <Text style={styles.exampleText} numberOfLines={1}>
            Örnek: {example}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const getLevelColor = (level: string) => {
    const colors: { [key: string]: string } = {
      'A1': '#22c55e',
      'A2': '#84cc16',
      'B1': '#eab308',
      'B2': '#f97316',
      'C1': '#ef4444',
      'C2': '#dc2626',
    };
    return colors[level] || '#6b7280';
  };

  const renderFilterButton = (filter: FilterType) => (
    <TouchableOpacity
      key={filter}
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text style={[
        styles.filterButtonText,
        selectedFilter === filter && styles.filterButtonTextActive
      ]}>
        {filter === 'all' ? 'Tümü' : filter}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kelime Arama</Text>
        <TouchableOpacity
          style={styles.filterToggle}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="options-outline" size={24} color="#1f2937" />
        </TouchableOpacity>
      </View>



      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Kelime, tanım veya çeviri ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Ionicons name="close-circle" size={20} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          {/* Level Filters */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Seviye</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterRow}>
                {filterOptions.map(renderFilterButton)}
              </View>
            </ScrollView>
          </View>

          {/* Sort Options */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Sıralama</Text>
            <View style={styles.sortRow}>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.sortButton,
                    selectedSort === option.key && styles.sortButtonActive
                  ]}
                  onPress={() => setSelectedSort(option.key)}
                >
                  <Text style={[
                    styles.sortButtonText,
                    selectedSort === option.key && styles.sortButtonTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Results */}
      <View style={styles.resultsContainer}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {isLoading ? 'Aranıyor...' : `${apiResults.length} kelime bulundu (API)`}
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        ) : (
          <FlatList
            data={apiResults}
            renderItem={renderWordItem}
            keyExtractor={(item, index) => `${item.word}-${index}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color="#9ca3af" />
                <Text style={styles.emptyText}>Kelime bulunamadı</Text>
                <Text style={styles.emptySubtext}>
                  API araması için bir kelime girin
                </Text>
              </View>
            }
          />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  filterToggle: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  clearButton: {
    padding: 4,
  },
  filtersContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  sortButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  resultsCount: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  wordItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  wordText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  wordMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  partOfSpeech: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  definitionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  apiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  apiBadgeText: {
    color: '#6366f1',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
});

export default SearchScreen;