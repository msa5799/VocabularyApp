import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import realTimeVocabularyAPI, { WordData as ApiWordData } from '../../services/api/realTimeVocabularyAPI';

interface Props {
  navigation: any;
  route: {
    params: {
      wordId?: number;
      word?: string;
      isApiWord?: boolean;
    };
  };
}





const WordDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { wordId, word, isApiWord } = route.params;
  const [apiWordData, setApiWordData] = useState<ApiWordData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWordData = async () => {
      try {
        if (word) {
          // Load from API
          const apiData = await realTimeVocabularyAPI.getWordDefinition(word);
          if (apiData) {
            setApiWordData(apiData);
          }
        }
      } catch (error) {
        console.error('Error loading word data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWordData();
  }, [word]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Kelime yükleniyor...</Text>
      </View>
    );
  }

  if (!apiWordData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Kelime bulunamadı</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Use API data
  const currentWordData = apiWordData;
  const isFromApi = true;

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

  const renderApiWordData = () => {
    if (!apiWordData) return null;
    
    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}>
              <Ionicons name="arrow-back" size={24} color="#6366f1" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.word}>{apiWordData.word}</Text>
              <View style={styles.levelBadge}>
                <Text style={[styles.levelText, { backgroundColor: getLevelColor(apiWordData.cefr_level || 'B1') }]}>
                  {apiWordData.cefr_level || 'B1'}
                </Text>
              </View>
              <View style={styles.apiBadge}>
                <Ionicons name="globe-outline" size={16} color="#6366f1" />
                <Text style={styles.apiBadgeText}>API</Text>
              </View>
            </View>
          </View>

          {/* Turkish Translation */}
          {apiWordData.word_tr && (
            <View style={styles.card}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Türkçe Karşılığı</Text>
                <Text style={styles.translation}>{apiWordData.word_tr}</Text>
              </View>
            </View>
          )}

          {/* Phonetic */}
          {apiWordData.phonetic && (
            <View style={styles.card}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Telaffuz</Text>
                <Text style={styles.partOfSpeech}>{apiWordData.phonetic}</Text>
              </View>
            </View>
          )}

          {/* Meanings */}
          {apiWordData.meanings.map((meaning: any, meaningIndex: number) => (
            <View key={meaningIndex} style={styles.card}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Kelime Türü</Text>
                <Text style={styles.partOfSpeech}>{meaning.partOfSpeech}</Text>
              </View>
              
              {meaning.definitions.map((definition: any, defIndex: number) => (
                <View key={defIndex} style={styles.section}>
                  <Text style={styles.sectionTitle}>İngilizce Tanım {meaning.definitions.length > 1 ? `${defIndex + 1}` : ''}</Text>
                  <Text style={styles.definition}>{definition.definition}</Text>
                  
                  {definition.definition_tr && (
                    <>
                      <Text style={styles.sectionTitle}>Türkçe Anlamı</Text>
                      <Text style={styles.translation}>{definition.definition_tr}</Text>
                    </>
                  )}
                  
                  {definition.example && (
                    <>
                      <Text style={styles.sectionTitle}>Örnek Cümle</Text>
                      <Text style={styles.example}>{definition.example}</Text>
                    </>
                  )}
                  
                  {definition.synonyms && definition.synonyms.length > 0 && (
                    <>
                      <Text style={styles.sectionTitle}>Eş Anlamlılar</Text>
                      <Text style={styles.definition}>{definition.synonyms.join(', ')}</Text>
                    </>
                  )}
                </View>
              ))}
            </View>
          ))}

          {/* Frequency */}
          {apiWordData.frequency_rank && (
            <View style={styles.card}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sıklık Sıralaması</Text>
                <Text style={styles.frequency}>#{apiWordData.frequency_rank}</Text>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.card}>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="bookmark-outline" size={20} color="#6366f1" />
                <Text style={styles.actionButtonText}>Kaydet</Text>
              </TouchableOpacity>
              {apiWordData.pronunciation && (
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="volume-high-outline" size={20} color="#6366f1" />
                  <Text style={styles.actionButtonText}>Seslendir</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="share-outline" size={20} color="#6366f1" />
                <Text style={styles.actionButtonText}>Paylaş</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };



  return renderApiWordData();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    marginTop: 12,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backIcon: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  word: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  levelBadge: {
    marginLeft: 12,
  },
  levelText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  partOfSpeech: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  definition: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 24,
  },
  translation: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '600',
    lineHeight: 24,
  },
  example: {
    fontSize: 16,
    color: '#4b5563',
    fontStyle: 'italic',
    lineHeight: 24,
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  frequency: {
    fontSize: 18,
    color: '#f59e0b',
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  apiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  apiBadgeText: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default WordDetailScreen;