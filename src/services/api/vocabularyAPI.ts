import { Word, CEFRLevel } from '../../types/database';

interface WordAPIResponse {
  word: string;
  phonetic?: string;
  phonetics?: Array<{
    text?: string;
    audio?: string;
  }>;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
      synonyms?: string[];
      antonyms?: string[];
    }>;
  }>;
}

class VocabularyAPIService {
  private readonly baseURL = 'https://api.dictionaryapi.dev/api/v2/entries/en';



  async fetchWordDefinition(word: string): Promise<WordAPIResponse | null> {
    try {
      const response = await fetch(`${this.baseURL}/${encodeURIComponent(word)}`);
      if (!response.ok) {
        console.warn(`API request failed for word: ${word}`);
        return null;
      }
      const data = await response.json();
      return Array.isArray(data) ? data[0] : data;
    } catch (error) {
      console.error(`Error fetching definition for ${word}:`, error);
      return null;
    }
  }



  async generateWordsForLevel(level: CEFRLevel, count: number = 10): Promise<Omit<Word, 'id' | 'created_at'>[]> {
    console.log(`API kullanıldığı için boş array döndürülüyor`);
    return [];
  }

  async generateAllLevelsWords(): Promise<Omit<Word, 'id' | 'created_at'>[]> {
    console.log('API kullanıldığı için boş array döndürülüyor');
    return [];
  }
}

export const vocabularyAPI = new VocabularyAPIService();