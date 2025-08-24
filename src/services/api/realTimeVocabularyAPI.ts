import Constants from 'expo-constants';

interface DictionaryAPIResponse {
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
  license?: {
    name: string;
    url: string;
  };
  sourceUrls?: string[];
}

interface TranslationAPIResponse {
  translatedText: string;
  detectedSourceLanguage?: string;
}

interface WordData {
  word: string;
  word_tr?: string;
  phonetic?: string;
  pronunciation?: string;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      definition_tr: string;
      example?: string;
      synonyms?: string[];
      antonyms?: string[];
    }>;
  }>;
  cefr_level?: string;
  frequency_rank?: number;
}

interface SearchResult {
  word: string;
  definition_en: string;
  definition_tr: string;
  example_en?: string;
  cefr_level?: string;
  part_of_speech?: string;
  frequency_rank?: number;
}

class RealTimeVocabularyAPI {
  private readonly DICTIONARY_API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en';
  private readonly MYMEMORY_API_BASE = 'https://api.mymemory.translated.net/get';
  private readonly BACKEND_API_BASE = 'http://localhost:3001/api';
  
  // CEFR level estimation based on word frequency and complexity
  private estimateCEFRLevel(word: string, frequencyRank?: number): string {
    const wordLength = word.length;
    
    // Simple heuristic for CEFR level estimation
    if (frequencyRank && frequencyRank <= 1000) return 'A1';
    if (frequencyRank && frequencyRank <= 2000) return 'A2';
    if (wordLength <= 5 && (!frequencyRank || frequencyRank <= 5000)) return 'B1';
    if (wordLength <= 8 && (!frequencyRank || frequencyRank <= 10000)) return 'B2';
    if (wordLength <= 12) return 'C1';
    return 'C2';
  }

  // Estimate frequency rank based on word characteristics
  private estimateFrequencyRank(word: string): number {
    const commonWords = [
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
      'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at'
    ];
    
    const index = commonWords.indexOf(word.toLowerCase());
    if (index !== -1) return index + 1;
    
    // Simple estimation based on word length and complexity
    const baseRank = word.length * 1000;
    const complexityFactor = (word.match(/[^a-zA-Z]/g) || []).length * 500;
    return Math.min(baseRank + complexityFactor, 50000);
  }

  private getLocalTranslation(text: string): string | null {
    // Genişletilmiş yerel çeviri sözlüğü
    const translations: { [key: string]: string } = {
      // Temel kelimeler
      'hello': 'merhaba',
      'world': 'dünya',
      'good': 'iyi',
      'bad': 'kötü',
      'yes': 'evet',
      'no': 'hayır',
      'please': 'lütfen',
      'thank': 'teşekkür',
      'thanks': 'teşekkürler',
      'welcome': 'hoş geldiniz',
      'goodbye': 'hoşçakal',
      'farewell': 'veda',
      
      // Kelime türleri
      'noun': 'isim',
      'verb': 'fiil',
      'adjective': 'sıfat',
      'adverb': 'zarf',
      'pronoun': 'zamir',
      'preposition': 'edat',
      'conjunction': 'bağlaç',
      'interjection': 'ünlem',
      
      // Yaygın kelimeler
      'house': 'ev',
      'home': 'ev',
      'family': 'aile',
      'friend': 'arkadaş',
      'love': 'aşk',
      'life': 'hayat',
      'time': 'zaman',
      'day': 'gün',
      'night': 'gece',
      'morning': 'sabah',
      'evening': 'akşam',
      'water': 'su',
      'food': 'yemek',
      'book': 'kitap',
      'school': 'okul',
       'money': 'para',
      'car': 'araba',
      'computer': 'bilgisayar',
      'phone': 'telefon',
      'music': 'müzik',
      'movie': 'film',
      'game': 'oyun',
      'sport': 'spor',
      'travel': 'seyahat',
      'language': 'dil',
      'country': 'ülke',
      'city': 'şehir',
      'street': 'sokak',
      'door': 'kapı',
      'window': 'pencere',
      'table': 'masa',
      'chair': 'sandalye',
      'bed': 'yatak',
      'room': 'oda',
      'kitchen': 'mutfak',
      'bathroom': 'banyo',
      'garden': 'bahçe',
      'tree': 'ağaç',
      'flower': 'çiçek',
      'sun': 'güneş',
      'moon': 'ay',
      'star': 'yıldız',
      'sky': 'gökyüzü',
      'earth': 'dünya',
      'fire': 'ateş',
      'air': 'hava',
      'wind': 'rüzgar',
      'rain': 'yağmur',
      'snow': 'kar',
      'hot': 'sıcak',
      'cold': 'soğuk',
      'warm': 'ılık',
      'cool': 'serin',
      'big': 'büyük',
      'small': 'küçük',
      'large': 'büyük',
      'little': 'küçük',
      'long': 'uzun',
      'short': 'kısa',
      'tall': 'uzun',
      'high': 'yüksek',
      'low': 'alçak',
      'fast': 'hızlı',
      'slow': 'yavaş',
      'easy': 'kolay',
      'hard': 'zor',
      'difficult': 'zor',
      'simple': 'basit',
      'complex': 'karmaşık',
      'beautiful': 'güzel',
      'ugly': 'çirkin',
      'nice': 'güzel',
      'pretty': 'güzel',
      'happy': 'mutlu',
      'sad': 'üzgün',
      'angry': 'kızgın',
      'tired': 'yorgun',
      'hungry': 'aç',
      'thirsty': 'susuz',
      'sick': 'hasta',
      'healthy': 'sağlıklı',
      'strong': 'güçlü',
      'weak': 'zayıf',
      'young': 'genç',
      'old': 'yaşlı',
      'new': 'yeni',
      'fresh': 'taze',
      'clean': 'temiz',
      'dirty': 'kirli',
      'rich': 'zengin',
      'poor': 'fakir',
       'busy': 'meşgul',
      'empty': 'boş',
      'full': 'dolu',
      'open': 'açık',
      'close': 'kapalı',
      'start': 'başla',
      'begin': 'başla',
      'finish': 'bitir',
      'end': 'son',
      'stop': 'dur',
      'go': 'git',
      'come': 'gel',
      'run': 'koş',
      'walk': 'yürü',
      'sit': 'otur',
      'stand': 'ayakta dur',
      'sleep': 'uyu',
      'eat': 'ye',
      'drink': 'iç',
      'speak': 'konuş',
      'talk': 'konuş',
      'listen': 'dinle',
      'hear': 'duy',
      'see': 'gör',
      'look': 'bak',
      'watch': 'izle',
      'read': 'oku',
      'write': 'yaz',
      'learn': 'öğren',
      'teach': 'öğret',
      'study': 'çalış',
      'work': 'çalış',
      'play': 'oyna',
      'sing': 'şarkı söyle',
      'dance': 'dans et',
      'laugh': 'gül',
      'cry': 'ağla',
      'smile': 'gülümse',
      'think': 'düşün',
      'know': 'bil',
      'understand': 'anla',
      'remember': 'hatırla',
      'forget': 'unut',
      'help': 'yardım et',
      'give': 'ver',
      'take': 'al',
      'buy': 'satın al',
      'sell': 'sat',
      'pay': 'öde',
      'cost': 'maliyet',
       'price': 'fiyat',
       'cheap': 'ucuz',
       'expensive': 'pahalı'
    };
    
    const lowerText = text.toLowerCase().trim();
    return translations[lowerText] || null;
  }

  // CORS proxy çözümü için Google Translate API fonksiyonu
  private async translateWithCorsProxy(text: string, targetLang: string = 'tr'): Promise<string> {
    try {
      const corsProxyUrl = 'https://corsproxy.io/?';
      const googleTranslateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      const proxyUrl = corsProxyUrl + encodeURIComponent(googleTranslateUrl);
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Google Translate API response format: [[["translated_text","original_text",null,null,3]],null,"en"]
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        return data[0][0][0];
      }
      
      throw new Error('Invalid response format from Google Translate');
    } catch (error) {
      console.error('CORS Proxy translation error:', error);
      throw error;
    }
  }

  // Backend servisi ile çeviri yapma fonksiyonu
  private async translateWithBackend(text: string, targetLang: string = 'tr'): Promise<string> {
    try {
      const response = await fetch(`${this.BACKEND_API_BASE}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, targetLang }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.translatedText) {
        return data.translatedText;
      }
      
      throw new Error('Invalid response from backend translation service');
    } catch (error) {
      console.error('Backend translation error:', error);
      throw error;
    }
  }

  // Backend servisi ile Cambridge Dictionary'den kelime bilgisi alma
  private async getCambridgeDefinitionFromBackend(word: string): Promise<any> {
    try {
      const response = await fetch(`${this.BACKEND_API_BASE}/cambridge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ word }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return {
          definition: data.definition,
          pronunciation: data.pronunciation,
          partOfSpeech: data.partOfSpeech,
          examples: data.examples
        };
      }
      
      throw new Error('Invalid response from Cambridge backend service');
    } catch (error) {
      console.error('Cambridge backend error:', error);
      throw error;
    }
  }

  async translateText(text: string, targetLang: string = 'tr'): Promise<string> {
    // Simple translation mapping for common words as fallback
    const translations: { [key: string]: string } = {
      'noun': 'isim',
      'verb': 'fiil',
      'adjective': 'sıfat',
      'adverb': 'zarf',
      'pronoun': 'zamir',
      'preposition': 'edat',
      'conjunction': 'bağlaç',
      'interjection': 'ünlem',
      'hello': 'merhaba',
      'world': 'dünya',
      'good': 'iyi',
      'bad': 'kötü',
      'yes': 'evet',
      'no': 'hayır',
      'please': 'lütfen',
      'thank': 'teşekkür',
      'thanks': 'teşekkürler',
      'welcome': 'hoş geldiniz',
      'goodbye': 'hoşçakal'
    };

    // Clean the text
    const cleanText = text.trim();
    if (!cleanText) return '';

    // Try local translation dictionary first
    const localTranslation = this.getLocalTranslation(cleanText);
    if (localTranslation) {
      return localTranslation;
    }

    // Önce backend servisi ile çeviri dene
    try {
      const backendTranslation = await this.translateWithBackend(cleanText, targetLang);
      if (backendTranslation && backendTranslation !== cleanText) {
        return backendTranslation;
      }
    } catch (backendError) {
      console.warn('Backend translation failed:', backendError);
    }

    // Backend başarısız olursa CORS proxy ile Google Translate'i dene
    try {
      const corsProxyTranslation = await this.translateWithCorsProxy(cleanText, targetLang);
      if (corsProxyTranslation && corsProxyTranslation !== cleanText) {
        return corsProxyTranslation;
      }
    } catch (corsError) {
      console.warn('CORS proxy translation failed:', corsError);
    }

    // Final fallback to local translations for single words
    const lowerText = cleanText.toLowerCase();
    if (translations[lowerText]) {
      return translations[lowerText];
    }

    // If all fails, return empty string
    return '';
  }

  async getWordDefinition(word: string): Promise<WordData | null> {
    try {
      const response = await fetch(`${this.DICTIONARY_API_BASE}/${encodeURIComponent(word.toLowerCase())}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null; // Word not found
        }
        throw new Error(`Dictionary API failed: ${response.status}`);
      }

      const data: DictionaryAPIResponse[] = await response.json();
      
      if (!data || data.length === 0) {
        return null;
      }

      const wordInfo = data[0];
      const frequencyRank = this.estimateFrequencyRank(word);
      const cefrLevel = this.estimateCEFRLevel(word, frequencyRank);

      // Translate the word itself
      const word_tr = await this.translateText(wordInfo.word);

      // Process meanings and translate definitions
      const processedMeanings = await Promise.all(
        wordInfo.meanings.map(async (meaning) => {
          const processedDefinitions = await Promise.all(
            meaning.definitions.map(async (def) => {
              const definition_tr = await this.translateText(def.definition);
              
              return {
                definition: def.definition,
                definition_tr,
                example: def.example,
                synonyms: def.synonyms,
                antonyms: def.antonyms
              };
            })
          );

          return {
            partOfSpeech: meaning.partOfSpeech,
            definitions: processedDefinitions
          };
        })
      );

      return {
        word: wordInfo.word,
        word_tr,
        phonetic: wordInfo.phonetic,
        pronunciation: wordInfo.phonetics?.[0]?.audio,
        meanings: processedMeanings,
        cefr_level: cefrLevel,
        frequency_rank: frequencyRank
      };
    } catch (error) {
      console.error('Error fetching word definition:', error);
      return null;
    }
  }

  async searchWords(query: string, limit: number = 20): Promise<SearchResult[]> {
    if (!query.trim()) {
      return [];
    }

    const results: SearchResult[] = [];
    
    try {
      // First, try to get the exact word
      const exactWordData = await this.getWordDefinition(query.trim());
      if (exactWordData && exactWordData.meanings.length > 0) {
        const firstMeaning = exactWordData.meanings[0];
        const firstDefinition = firstMeaning.definitions[0];
        
        results.push({
          word: exactWordData.word,
          definition_en: firstDefinition.definition,
          definition_tr: firstDefinition.definition_tr,
          example_en: firstDefinition.example,
          cefr_level: exactWordData.cefr_level,
          part_of_speech: firstMeaning.partOfSpeech,
          frequency_rank: exactWordData.frequency_rank
        });
      }
    } catch (error) {
      console.warn(`Failed to fetch exact word: ${query}`, error);
    }

    // If we don't have enough results, try some common word variations
    if (results.length < limit) {
      const commonWords = [
        'hello', 'world', 'computer', 'internet', 'technology', 'science',
        'education', 'learning', 'knowledge', 'information', 'communication',
        'development', 'programming', 'software', 'application', 'system',
        'network', 'database', 'security', 'privacy', 'innovation', 'digital',
        'artificial', 'intelligence', 'machine', 'algorithm', 'data', 'analysis',
        'research', 'discovery', 'exploration', 'adventure', 'journey', 'travel',
        'experience', 'memory', 'emotion', 'feeling', 'happiness', 'success',
        'achievement', 'goal', 'dream', 'future', 'present', 'past', 'time',
        'moment', 'opportunity', 'challenge', 'solution', 'problem', 'question',
        'answer', 'truth', 'reality', 'imagination', 'creativity', 'art',
        'music', 'literature', 'culture', 'society', 'community', 'family',
        'friend', 'relationship', 'love', 'care', 'support', 'help', 'service',
        'work', 'job', 'career', 'profession', 'skill', 'talent', 'ability',
        'strength', 'power', 'energy', 'force', 'nature', 'environment',
        'earth', 'planet', 'universe', 'space', 'star', 'moon', 'sun',
        'light', 'dark', 'color', 'sound', 'voice', 'language', 'word',
        'sentence', 'story', 'book', 'page', 'chapter', 'beginning', 'end'
      ];

      const filteredWords = commonWords
        .filter(word => 
          word.toLowerCase().includes(query.toLowerCase()) &&
          !results.some(result => result.word.toLowerCase() === word.toLowerCase())
        )
        .slice(0, limit - results.length);

      for (const word of filteredWords) {
        try {
          const wordData = await this.getWordDefinition(word);
          if (wordData && wordData.meanings.length > 0) {
            const firstMeaning = wordData.meanings[0];
            const firstDefinition = firstMeaning.definitions[0];
            
            results.push({
              word: wordData.word,
              definition_en: firstDefinition.definition,
              definition_tr: firstDefinition.definition_tr,
              example_en: firstDefinition.example,
              cefr_level: wordData.cefr_level,
              part_of_speech: firstMeaning.partOfSpeech,
              frequency_rank: wordData.frequency_rank
            });
          }
        } catch (error) {
          console.warn(`Failed to fetch data for word: ${word}`, error);
          continue;
        }
      }
    }

    return results;
  }

  async getRandomWord(): Promise<SearchResult | null> {
    const randomWords = [
      'serendipity', 'ephemeral', 'wanderlust', 'mellifluous', 'petrichor',
      'luminous', 'tranquil', 'resilient', 'eloquent', 'magnificent',
      'harmonious', 'innovative', 'fascinating', 'extraordinary', 'remarkable',
      'brilliant', 'creative', 'inspiring', 'beautiful', 'wonderful',
      'amazing', 'incredible', 'fantastic', 'marvelous', 'spectacular',
      'outstanding', 'exceptional', 'impressive', 'stunning', 'breathtaking'
    ];

    const randomWord = randomWords[Math.floor(Math.random() * randomWords.length)];
    
    try {
      const wordData = await this.getWordDefinition(randomWord);
      if (wordData && wordData.meanings.length > 0) {
        const firstMeaning = wordData.meanings[0];
        const firstDefinition = firstMeaning.definitions[0];
        
        return {
          word: wordData.word,
          definition_en: firstDefinition.definition,
          definition_tr: firstDefinition.definition_tr,
          example_en: firstDefinition.example,
          cefr_level: wordData.cefr_level,
          part_of_speech: firstMeaning.partOfSpeech,
          frequency_rank: wordData.frequency_rank
        };
      }
    } catch (error) {
      console.error('Error fetching random word:', error);
    }

    return null;
  }

  async getWordsByLevel(level: string, limit: number = 10): Promise<SearchResult[]> {
    const wordsByLevel: { [key: string]: string[] } = {
      'A1': ['hello', 'goodbye', 'yes', 'no', 'please', 'thank', 'sorry', 'help', 'good', 'bad', 'big', 'small', 'new', 'old', 'hot', 'cold', 'fast', 'slow', 'easy', 'hard'],
      'A2': ['family', 'friend', 'house', 'school', 'work', 'food', 'water', 'time', 'money', 'happy', 'beautiful', 'strong', 'young', 'free', 'open', 'close', 'start', 'finish', 'buy', 'sell'],
      'B1': ['important', 'different', 'possible', 'available', 'necessary', 'interesting', 'difficult', 'popular', 'successful', 'comfortable', 'experience', 'knowledge', 'education', 'development', 'opportunity', 'challenge', 'solution', 'problem', 'decision', 'relationship'],
      'B2': ['significant', 'essential', 'comprehensive', 'efficient', 'innovative', 'sustainable', 'competitive', 'professional', 'technological', 'environmental', 'responsibility', 'achievement', 'performance', 'management', 'organization', 'communication', 'investigation', 'establishment', 'requirement', 'improvement'],
      'C1': ['sophisticated', 'contemporary', 'fundamental', 'substantial', 'considerable', 'unprecedented', 'comprehensive', 'revolutionary', 'extraordinary', 'magnificent', 'implementation', 'transformation', 'interpretation', 'demonstration', 'recommendation', 'specification', 'collaboration', 'administration', 'representation', 'characterization'],
      'C2': ['quintessential', 'ubiquitous', 'paradigmatic', 'multifaceted', 'inexorable', 'serendipitous', 'ephemeral', 'perspicacious', 'magnanimous', 'indefatigable', 'juxtaposition', 'metamorphosis', 'epistemological', 'phenomenological', 'anthropomorphic', 'psychoanalytical', 'interdisciplinary', 'counterproductive', 'incomprehensible', 'disproportionate']
    };

    const words = wordsByLevel[level] || wordsByLevel['B1'];
    // Shuffle the words array and select random words
    const shuffledWords = [...words].sort(() => Math.random() - 0.5);
    const selectedWords = shuffledWords.slice(0, limit);
    const results: SearchResult[] = [];

    for (const word of selectedWords) {
      try {
        const wordData = await this.getWordDefinition(word);
        if (wordData && wordData.meanings.length > 0) {
          const firstMeaning = wordData.meanings[0];
          const firstDefinition = firstMeaning.definitions[0];
          
          results.push({
            word: wordData.word,
            definition_en: firstDefinition.definition,
            definition_tr: firstDefinition.definition_tr,
            example_en: firstDefinition.example,
            cefr_level: level,
            part_of_speech: firstMeaning.partOfSpeech,
            frequency_rank: wordData.frequency_rank
          });
        }
      } catch (error) {
        console.warn(`Failed to fetch data for word: ${word}`, error);
        continue;
      }
    }

    return results;
  }
}

export const realTimeVocabularyAPI = new RealTimeVocabularyAPI();
export type { WordData, SearchResult };
export default realTimeVocabularyAPI;