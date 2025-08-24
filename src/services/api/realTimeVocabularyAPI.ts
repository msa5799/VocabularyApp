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

  async getWordsByLevel(level: string, limit: number = 10, excludeWords: string[] = []): Promise<SearchResult[]> {
    try {
      // AI'dan kelime önerileri al
      const response = await fetch(`${this.BACKEND_API_BASE}/ai-word-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level: level,
          limit: limit,
          language: 'english',
          excludeWords: excludeWords
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.words) {
          // AI'dan gelen kelimeleri işle
          const aiWords = await Promise.all(
            data.words.map(async (wordData: any) => {
              try {
                // Her kelime için detaylı bilgi al
                const wordDetail = await this.getWordDefinition(wordData.word);
                if (wordDetail) {
                  return {
                    word: wordDetail.word,
                    definition_en: wordDetail.meanings[0]?.definitions[0]?.definition || wordData.definition || 'Definition not available',
                    definition_tr: wordDetail.meanings[0]?.definitions[0]?.definition_tr || wordData.definition_tr || 'Türkçe tanım mevcut değil',
                    example_en: wordDetail.meanings[0]?.definitions[0]?.example || wordData.example,
                    cefr_level: level,
                    part_of_speech: wordDetail.meanings[0]?.partOfSpeech || wordData.part_of_speech || 'unknown',
                    frequency_rank: wordDetail.frequency_rank
                  };
                }
              } catch (error) {
                console.warn(`Error processing AI word: ${wordData.word}`, error);
              }
              
              // Fallback: AI'dan gelen temel bilgiyi kullan
              return {
                word: wordData.word,
                definition_en: wordData.definition || 'Definition not available',
                definition_tr: wordData.definition_tr || 'Türkçe tanım mevcut değil',
                example_en: wordData.example,
                cefr_level: level,
                part_of_speech: wordData.part_of_speech || 'unknown'
              };
            })
          );
          
          return aiWords.filter(word => word !== null);
        }
      }
    } catch (error) {
      console.warn('AI word suggestion failed, using fallback words:', error);
    }

    // Fallback: Önceden tanımlanmış kelime verileri
    const preDefinedWords: { [key: string]: Array<{word: string, definition_en: string, definition_tr: string, example_en?: string, part_of_speech: string}> } = {
      'A1': [
        { word: 'hello', definition_en: 'A greeting used when meeting someone', definition_tr: 'Birisiyle karşılaştığında kullanılan selamlama', example_en: 'Hello, how are you?', part_of_speech: 'interjection' },
        { word: 'goodbye', definition_en: 'A farewell expression', definition_tr: 'Veda ifadesi', example_en: 'Goodbye, see you tomorrow!', part_of_speech: 'interjection' },
        { word: 'yes', definition_en: 'Used to express agreement or confirmation', definition_tr: 'Onay veya doğrulama ifadesi', example_en: 'Yes, I agree with you.', part_of_speech: 'adverb' },
        { word: 'no', definition_en: 'Used to express disagreement or denial', definition_tr: 'Karşı çıkma veya reddetme ifadesi', example_en: 'No, I don\'t want that.', part_of_speech: 'adverb' },
        { word: 'please', definition_en: 'Used to make a polite request', definition_tr: 'Kibarca rica etmek için kullanılır', example_en: 'Please help me with this.', part_of_speech: 'adverb' },
        { word: 'thank', definition_en: 'To express gratitude', definition_tr: 'Minnettarlık ifade etmek', example_en: 'I want to thank you for your help.', part_of_speech: 'verb' },
        { word: 'good', definition_en: 'Having positive qualities; satisfactory', definition_tr: 'Olumlu niteliklere sahip; tatmin edici', example_en: 'This is a good book.', part_of_speech: 'adjective' },
        { word: 'bad', definition_en: 'Having negative qualities; poor', definition_tr: 'Olumsuz niteliklere sahip; kötü', example_en: 'The weather is bad today.', part_of_speech: 'adjective' },
        { word: 'big', definition_en: 'Large in size or extent', definition_tr: 'Boyut veya kapsam olarak büyük', example_en: 'That\'s a big house.', part_of_speech: 'adjective' },
        { word: 'small', definition_en: 'Little in size or extent', definition_tr: 'Boyut veya kapsam olarak küçük', example_en: 'She has a small car.', part_of_speech: 'adjective' },
        { word: 'new', definition_en: 'Recently made or created', definition_tr: 'Yakın zamanda yapılmış veya yaratılmış', example_en: 'I bought a new phone.', part_of_speech: 'adjective' },
        { word: 'old', definition_en: 'Having existed for a long time', definition_tr: 'Uzun süredir var olan', example_en: 'This is an old building.', part_of_speech: 'adjective' },
        { word: 'hot', definition_en: 'Having a high temperature', definition_tr: 'Yüksek sıcaklığa sahip', example_en: 'The coffee is very hot.', part_of_speech: 'adjective' },
        { word: 'cold', definition_en: 'Having a low temperature', definition_tr: 'Düşük sıcaklığa sahip', example_en: 'It\'s cold outside today.', part_of_speech: 'adjective' },
        { word: 'fast', definition_en: 'Moving or happening quickly', definition_tr: 'Hızlı hareket eden veya olan', example_en: 'He runs very fast.', part_of_speech: 'adjective' },
        { word: 'slow', definition_en: 'Moving or happening at a low speed', definition_tr: 'Düşük hızda hareket eden veya olan', example_en: 'The train is slow today.', part_of_speech: 'adjective' },
        { word: 'easy', definition_en: 'Not difficult; simple to do', definition_tr: 'Zor değil; yapması basit', example_en: 'This test is easy.', part_of_speech: 'adjective' },
        { word: 'hard', definition_en: 'Difficult to do or understand', definition_tr: 'Yapması veya anlaması zor', example_en: 'Math is hard for me.', part_of_speech: 'adjective' },
        { word: 'help', definition_en: 'To assist or support someone', definition_tr: 'Birine yardım etmek veya destek olmak', example_en: 'Can you help me carry this?', part_of_speech: 'verb' },
        { word: 'sorry', definition_en: 'Expressing regret or apology', definition_tr: 'Pişmanlık veya özür ifadesi', example_en: 'I\'m sorry for being late.', part_of_speech: 'adjective' }
      ],
      'A2': [
        { word: 'family', definition_en: 'A group of people related by blood or marriage', definition_tr: 'Kan bağı veya evlilikle bağlı insanlar grubu', example_en: 'I love spending time with my family.', part_of_speech: 'noun' },
        { word: 'friend', definition_en: 'A person you know well and like', definition_tr: 'İyi tanıdığınız ve sevdiğiniz kişi', example_en: 'She is my best friend.', part_of_speech: 'noun' },
        { word: 'house', definition_en: 'A building where people live', definition_tr: 'İnsanların yaşadığı bina', example_en: 'We bought a new house last year.', part_of_speech: 'noun' },
        { word: 'school', definition_en: 'An institution for education', definition_tr: 'Eğitim kurumu', example_en: 'Children go to school to learn.', part_of_speech: 'noun' },
        { word: 'work', definition_en: 'Activity involving effort to achieve a purpose', definition_tr: 'Bir amaca ulaşmak için çaba gerektiren faaliyet', example_en: 'I have a lot of work to do today.', part_of_speech: 'noun' },
        { word: 'food', definition_en: 'Substances consumed to provide nutrition', definition_tr: 'Beslenme sağlamak için tüketilen maddeler', example_en: 'I love Italian food.', part_of_speech: 'noun' },
        { word: 'water', definition_en: 'A clear liquid essential for life', definition_tr: 'Yaşam için gerekli berrak sıvı', example_en: 'Please drink more water.', part_of_speech: 'noun' },
        { word: 'time', definition_en: 'The indefinite continued progress of existence', definition_tr: 'Varlığın belirsiz sürekli ilerleyişi', example_en: 'What time is it now?', part_of_speech: 'noun' },
        { word: 'money', definition_en: 'A medium of exchange in the form of coins and banknotes', definition_tr: 'Madeni para ve banknot şeklinde değişim aracı', example_en: 'I need to save more money.', part_of_speech: 'noun' },
        { word: 'happy', definition_en: 'Feeling or showing pleasure or contentment', definition_tr: 'Memnuniyet veya hoşnutluk hissetmek', example_en: 'She looks very happy today.', part_of_speech: 'adjective' },
        { word: 'beautiful', definition_en: 'Pleasing to the senses or mind aesthetically', definition_tr: 'Estetik olarak duyulara veya zihne hoş gelen', example_en: 'The sunset is beautiful.', part_of_speech: 'adjective' },
        { word: 'strong', definition_en: 'Having great physical power', definition_tr: 'Büyük fiziksel güce sahip', example_en: 'He is very strong and can lift heavy things.', part_of_speech: 'adjective' },
        { word: 'young', definition_en: 'Having lived for a relatively short time', definition_tr: 'Nispeten kısa süre yaşamış', example_en: 'She is young and energetic.', part_of_speech: 'adjective' },
        { word: 'free', definition_en: 'Not under the control of another', definition_tr: 'Başkasının kontrolü altında olmayan', example_en: 'The birds are free to fly.', part_of_speech: 'adjective' },
        { word: 'open', definition_en: 'Not closed or blocked', definition_tr: 'Kapalı veya engellenmiş olmayan', example_en: 'Please keep the door open.', part_of_speech: 'adjective' },
        { word: 'close', definition_en: 'To shut something', definition_tr: 'Bir şeyi kapatmak', example_en: 'Please close the window.', part_of_speech: 'verb' },
        { word: 'start', definition_en: 'To begin doing something', definition_tr: 'Bir şey yapmaya başlamak', example_en: 'Let\'s start the meeting now.', part_of_speech: 'verb' },
        { word: 'finish', definition_en: 'To complete something', definition_tr: 'Bir şeyi tamamlamak', example_en: 'I need to finish my homework.', part_of_speech: 'verb' },
        { word: 'buy', definition_en: 'To purchase something', definition_tr: 'Bir şey satın almak', example_en: 'I want to buy a new car.', part_of_speech: 'verb' },
        { word: 'sell', definition_en: 'To give something in exchange for money', definition_tr: 'Para karşılığında bir şey vermek', example_en: 'They sell fresh vegetables.', part_of_speech: 'verb' }
      ],
      'B1': [
        { word: 'important', definition_en: 'Having great significance or value', definition_tr: 'Büyük öneme veya değere sahip', example_en: 'Education is very important for success.', part_of_speech: 'adjective' },
        { word: 'different', definition_en: 'Not the same as another', definition_tr: 'Diğerinden farklı', example_en: 'These two books are completely different.', part_of_speech: 'adjective' },
        { word: 'possible', definition_en: 'Able to be done or achieved', definition_tr: 'Yapılabilir veya başarılabilir', example_en: 'Is it possible to finish this today?', part_of_speech: 'adjective' },
        { word: 'available', definition_en: 'Ready for use or accessible', definition_tr: 'Kullanıma hazır veya erişilebilir', example_en: 'The manager is available for a meeting.', part_of_speech: 'adjective' },
        { word: 'necessary', definition_en: 'Required to be done or achieved', definition_tr: 'Yapılması veya başarılması gereken', example_en: 'It\'s necessary to study for the exam.', part_of_speech: 'adjective' },
        { word: 'interesting', definition_en: 'Arousing curiosity or attention', definition_tr: 'Merak veya ilgi uyandıran', example_en: 'This documentary is very interesting.', part_of_speech: 'adjective' },
        { word: 'difficult', definition_en: 'Hard to do, understand, or deal with', definition_tr: 'Yapması, anlaması veya başa çıkması zor', example_en: 'Learning a new language can be difficult.', part_of_speech: 'adjective' },
        { word: 'popular', definition_en: 'Liked or admired by many people', definition_tr: 'Birçok kişi tarafından sevilen veya beğenilen', example_en: 'This song is very popular among teenagers.', part_of_speech: 'adjective' },
        { word: 'successful', definition_en: 'Achieving desired aims or results', definition_tr: 'İstenilen amaçlara veya sonuçlara ulaşan', example_en: 'She is a successful businesswoman.', part_of_speech: 'adjective' },
        { word: 'comfortable', definition_en: 'Providing physical ease and relaxation', definition_tr: 'Fiziksel rahatlık ve gevşeme sağlayan', example_en: 'This chair is very comfortable.', part_of_speech: 'adjective' },
        { word: 'experience', definition_en: 'Knowledge gained through involvement in events', definition_tr: 'Olaylara katılım yoluyla kazanılan bilgi', example_en: 'She has a lot of experience in teaching.', part_of_speech: 'noun' },
        { word: 'knowledge', definition_en: 'Information and skills acquired through experience', definition_tr: 'Deneyim yoluyla edinilen bilgi ve beceriler', example_en: 'His knowledge of history is impressive.', part_of_speech: 'noun' },
        { word: 'education', definition_en: 'The process of learning and teaching', definition_tr: 'Öğrenme ve öğretme süreci', example_en: 'Education is the key to success.', part_of_speech: 'noun' },
        { word: 'development', definition_en: 'The process of growth or progress', definition_tr: 'Büyüme veya ilerleme süreci', example_en: 'The development of technology is rapid.', part_of_speech: 'noun' },
        { word: 'opportunity', definition_en: 'A chance for advancement or progress', definition_tr: 'İlerleme veya gelişme şansı', example_en: 'This job offers great opportunities.', part_of_speech: 'noun' },
        { word: 'challenge', definition_en: 'A difficult task that tests abilities', definition_tr: 'Yetenekleri test eden zor görev', example_en: 'Learning programming is a big challenge.', part_of_speech: 'noun' },
        { word: 'solution', definition_en: 'A way to solve a problem', definition_tr: 'Bir sorunu çözme yolu', example_en: 'We need to find a solution to this problem.', part_of_speech: 'noun' },
        { word: 'problem', definition_en: 'A difficult situation requiring a solution', definition_tr: 'Çözüm gerektiren zor durum', example_en: 'Traffic is a major problem in big cities.', part_of_speech: 'noun' },
        { word: 'decision', definition_en: 'A choice made after consideration', definition_tr: 'Düşünme sonrası yapılan seçim', example_en: 'Making this decision was not easy.', part_of_speech: 'noun' },
        { word: 'relationship', definition_en: 'The way people or things are connected', definition_tr: 'İnsanların veya şeylerin bağlantı şekli', example_en: 'They have a good relationship.', part_of_speech: 'noun' }
      ],
      'B2': [
        { word: 'significant', definition_en: 'Important or notable in effect or meaning', definition_tr: 'Etki veya anlam bakımından önemli veya dikkate değer', example_en: 'There was a significant improvement in sales.', part_of_speech: 'adjective' },
        { word: 'essential', definition_en: 'Absolutely necessary; extremely important', definition_tr: 'Kesinlikle gerekli; son derece önemli', example_en: 'Water is essential for life.', part_of_speech: 'adjective' },
        { word: 'comprehensive', definition_en: 'Complete and including everything necessary', definition_tr: 'Tam ve gerekli her şeyi içeren', example_en: 'We need a comprehensive plan for the project.', part_of_speech: 'adjective' },
        { word: 'efficient', definition_en: 'Working in a well-organized way', definition_tr: 'İyi organize edilmiş şekilde çalışan', example_en: 'This new system is more efficient.', part_of_speech: 'adjective' },
        { word: 'innovative', definition_en: 'Introducing new ideas or methods', definition_tr: 'Yeni fikirler veya yöntemler sunan', example_en: 'The company is known for its innovative products.', part_of_speech: 'adjective' },
        { word: 'sustainable', definition_en: 'Able to continue over a long period', definition_tr: 'Uzun süre devam edebilir', example_en: 'We need sustainable energy sources.', part_of_speech: 'adjective' },
        { word: 'competitive', definition_en: 'Having a strong desire to win or succeed', definition_tr: 'Kazanma veya başarılı olma konusunda güçlü istek', example_en: 'The market is very competitive.', part_of_speech: 'adjective' },
        { word: 'professional', definition_en: 'Relating to a job requiring special training', definition_tr: 'Özel eğitim gerektiren işle ilgili', example_en: 'She maintains a professional attitude.', part_of_speech: 'adjective' },
        { word: 'technological', definition_en: 'Relating to or involving technology', definition_tr: 'Teknoloji ile ilgili veya teknoloji içeren', example_en: 'Technological advances have changed our lives.', part_of_speech: 'adjective' },
        { word: 'environmental', definition_en: 'Relating to the natural world', definition_tr: 'Doğal dünya ile ilgili', example_en: 'Environmental protection is crucial.', part_of_speech: 'adjective' },
        { word: 'responsibility', definition_en: 'The state of being accountable for something', definition_tr: 'Bir şeyden sorumlu olma durumu', example_en: 'Taking care of the environment is our responsibility.', part_of_speech: 'noun' },
        { word: 'achievement', definition_en: 'Something accomplished successfully', definition_tr: 'Başarıyla tamamlanan bir şey', example_en: 'Graduating from university was a great achievement.', part_of_speech: 'noun' },
        { word: 'performance', definition_en: 'The action of carrying out a task', definition_tr: 'Bir görevi yerine getirme eylemi', example_en: 'Her performance in the presentation was excellent.', part_of_speech: 'noun' },
        { word: 'management', definition_en: 'The process of controlling or organizing', definition_tr: 'Kontrol etme veya organize etme süreci', example_en: 'Good time management is essential for success.', part_of_speech: 'noun' },
        { word: 'organization', definition_en: 'A structured group working together', definition_tr: 'Birlikte çalışan yapılandırılmış grup', example_en: 'She works for a non-profit organization.', part_of_speech: 'noun' },
        { word: 'communication', definition_en: 'The exchange of information or ideas', definition_tr: 'Bilgi veya fikir alışverişi', example_en: 'Effective communication is key in business.', part_of_speech: 'noun' },
        { word: 'investigation', definition_en: 'A detailed examination to discover facts', definition_tr: 'Gerçekleri keşfetmek için ayrıntılı inceleme', example_en: 'The police conducted a thorough investigation.', part_of_speech: 'noun' },
        { word: 'establishment', definition_en: 'The action of setting up an organization', definition_tr: 'Bir organizasyon kurma eylemi', example_en: 'The establishment of the company took two years.', part_of_speech: 'noun' },
        { word: 'requirement', definition_en: 'Something that is needed or demanded', definition_tr: 'İhtiyaç duyulan veya talep edilen şey', example_en: 'Meeting the requirements is mandatory.', part_of_speech: 'noun' },
        { word: 'improvement', definition_en: 'The process of making something better', definition_tr: 'Bir şeyi daha iyi hale getirme süreci', example_en: 'There has been significant improvement in quality.', part_of_speech: 'noun' }
      ],
      'C1': [
        { word: 'sophisticated', definition_en: 'Highly developed and complex', definition_tr: 'Yüksek düzeyde gelişmiş ve karmaşık', example_en: 'The software uses sophisticated algorithms.', part_of_speech: 'adjective' },
        { word: 'contemporary', definition_en: 'Belonging to the present time', definition_tr: 'Şimdiki zamana ait', example_en: 'Contemporary art reflects modern society.', part_of_speech: 'adjective' },
        { word: 'fundamental', definition_en: 'Forming a necessary base or core', definition_tr: 'Gerekli bir temel veya çekirdek oluşturan', example_en: 'Understanding grammar is fundamental to language learning.', part_of_speech: 'adjective' },
        { word: 'substantial', definition_en: 'Of considerable importance or size', definition_tr: 'Önemli boyutta veya büyüklükte', example_en: 'There was a substantial increase in profits.', part_of_speech: 'adjective' },
        { word: 'considerable', definition_en: 'Notably large in size or amount', definition_tr: 'Boyut veya miktar olarak dikkate değer büyük', example_en: 'The project requires considerable investment.', part_of_speech: 'adjective' },
        { word: 'unprecedented', definition_en: 'Never done or known before', definition_tr: 'Daha önce hiç yapılmamış veya bilinmeyen', example_en: 'The pandemic created unprecedented challenges.', part_of_speech: 'adjective' },
        { word: 'comprehensive', definition_en: 'Complete and including everything necessary', definition_tr: 'Tam ve gerekli her şeyi içeren', example_en: 'The report provides a comprehensive analysis.', part_of_speech: 'adjective' },
        { word: 'revolutionary', definition_en: 'Involving complete change', definition_tr: 'Tam değişim içeren', example_en: 'The invention was revolutionary for its time.', part_of_speech: 'adjective' },
        { word: 'extraordinary', definition_en: 'Very unusual or remarkable', definition_tr: 'Çok sıradışı veya dikkate değer', example_en: 'She has extraordinary talent in music.', part_of_speech: 'adjective' },
        { word: 'magnificent', definition_en: 'Extremely beautiful or impressive', definition_tr: 'Son derece güzel veya etkileyici', example_en: 'The cathedral has magnificent architecture.', part_of_speech: 'adjective' },
        { word: 'implementation', definition_en: 'The process of putting a plan into effect', definition_tr: 'Bir planı uygulamaya koyma süreci', example_en: 'The implementation of the new policy begins next month.', part_of_speech: 'noun' },
        { word: 'transformation', definition_en: 'A complete change in form or appearance', definition_tr: 'Biçim veya görünümde tam değişiklik', example_en: 'The city underwent a major transformation.', part_of_speech: 'noun' },
        { word: 'interpretation', definition_en: 'The explanation of the meaning of something', definition_tr: 'Bir şeyin anlamının açıklanması', example_en: 'His interpretation of the poem was insightful.', part_of_speech: 'noun' },
        { word: 'demonstration', definition_en: 'The action of showing something clearly', definition_tr: 'Bir şeyi açıkça gösterme eylemi', example_en: 'The teacher gave a demonstration of the experiment.', part_of_speech: 'noun' },
        { word: 'recommendation', definition_en: 'A suggestion about the best course of action', definition_tr: 'En iyi eylem planı hakkında öneri', example_en: 'I followed the doctor\'s recommendation.', part_of_speech: 'noun' },
        { word: 'specification', definition_en: 'A detailed description of requirements', definition_tr: 'Gereksinimlerin ayrıntılı açıklaması', example_en: 'The technical specification is very detailed.', part_of_speech: 'noun' },
        { word: 'collaboration', definition_en: 'The action of working together', definition_tr: 'Birlikte çalışma eylemi', example_en: 'The project was a collaboration between two companies.', part_of_speech: 'noun' },
        { word: 'administration', definition_en: 'The management of public affairs', definition_tr: 'Kamu işlerinin yönetimi', example_en: 'The new administration promises reform.', part_of_speech: 'noun' },
        { word: 'representation', definition_en: 'The action of speaking for someone', definition_tr: 'Birisi adına konuşma eylemi', example_en: 'The lawyer provided legal representation.', part_of_speech: 'noun' },
        { word: 'characterization', definition_en: 'The description of distinctive features', definition_tr: 'Ayırt edici özelliklerin tanımlanması', example_en: 'The characterization in the novel is excellent.', part_of_speech: 'noun' }
      ],
      'C2': [
        { word: 'quintessential', definition_en: 'Representing the most perfect example of a quality', definition_tr: 'Bir niteliğin en mükemmel örneğini temsil eden', example_en: 'She is the quintessential professional.', part_of_speech: 'adjective' },
        { word: 'ubiquitous', definition_en: 'Present, appearing, or found everywhere', definition_tr: 'Her yerde mevcut, görünen veya bulunan', example_en: 'Smartphones have become ubiquitous in modern society.', part_of_speech: 'adjective' },
        { word: 'paradigmatic', definition_en: 'Serving as a typical example or pattern', definition_tr: 'Tipik örnek veya model olarak hizmet eden', example_en: 'His work is paradigmatic of the genre.', part_of_speech: 'adjective' },
        { word: 'multifaceted', definition_en: 'Having many different aspects or features', definition_tr: 'Birçok farklı yönü veya özelliği olan', example_en: 'The problem is multifaceted and complex.', part_of_speech: 'adjective' },
        { word: 'inexorable', definition_en: 'Impossible to stop or prevent', definition_tr: 'Durdurulamaz veya önlenemez', example_en: 'The inexorable march of time affects us all.', part_of_speech: 'adjective' },
        { word: 'serendipitous', definition_en: 'Occurring by happy chance', definition_tr: 'Mutlu bir tesadüfle meydana gelen', example_en: 'Their meeting was serendipitous.', part_of_speech: 'adjective' },
        { word: 'ephemeral', definition_en: 'Lasting for a very short time', definition_tr: 'Çok kısa süre dayanıklı', example_en: 'The beauty of cherry blossoms is ephemeral.', part_of_speech: 'adjective' },
        { word: 'perspicacious', definition_en: 'Having keen insight or discernment', definition_tr: 'Keskin kavrayış veya ayırt etme yetisine sahip', example_en: 'Her perspicacious analysis impressed everyone.', part_of_speech: 'adjective' },
        { word: 'magnanimous', definition_en: 'Generous in forgiving; noble in spirit', definition_tr: 'Affetmede cömert; ruhta asil', example_en: 'He was magnanimous in victory.', part_of_speech: 'adjective' },
        { word: 'indefatigable', definition_en: 'Persisting tirelessly', definition_tr: 'Yorulmadan sebat eden', example_en: 'She is an indefatigable worker.', part_of_speech: 'adjective' },
        { word: 'juxtaposition', definition_en: 'The fact of placing things side by side', definition_tr: 'Şeyleri yan yana yerleştirme gerçeği', example_en: 'The juxtaposition of old and new architecture is striking.', part_of_speech: 'noun' },
        { word: 'metamorphosis', definition_en: 'A complete change of form or nature', definition_tr: 'Biçim veya doğada tam değişiklik', example_en: 'The caterpillar\'s metamorphosis into a butterfly is remarkable.', part_of_speech: 'noun' },
        { word: 'epistemological', definition_en: 'Relating to the theory of knowledge', definition_tr: 'Bilgi teorisi ile ilgili', example_en: 'The philosopher explored epistemological questions.', part_of_speech: 'adjective' },
        { word: 'phenomenological', definition_en: 'Relating to the study of consciousness', definition_tr: 'Bilinç çalışması ile ilgili', example_en: 'The research took a phenomenological approach.', part_of_speech: 'adjective' },
        { word: 'anthropomorphic', definition_en: 'Attributing human characteristics to non-human things', definition_tr: 'İnsan olmayan şeylere insan özelliklerini atfetme', example_en: 'The cartoon features anthropomorphic animals.', part_of_speech: 'adjective' },
        { word: 'psychoanalytical', definition_en: 'Relating to psychoanalysis', definition_tr: 'Psikanaliz ile ilgili', example_en: 'The novel offers a psychoanalytical perspective.', part_of_speech: 'adjective' },
        { word: 'interdisciplinary', definition_en: 'Combining multiple academic disciplines', definition_tr: 'Birden fazla akademik disiplini birleştiren', example_en: 'The program offers an interdisciplinary approach.', part_of_speech: 'adjective' },
        { word: 'counterproductive', definition_en: 'Having the opposite of the desired effect', definition_tr: 'İstenilen etkinin tersine sahip', example_en: 'Micromanaging can be counterproductive.', part_of_speech: 'adjective' },
        { word: 'incomprehensible', definition_en: 'Impossible to understand', definition_tr: 'Anlaşılması imkansız', example_en: 'The technical jargon was incomprehensible to most people.', part_of_speech: 'adjective' },
        { word: 'disproportionate', definition_en: 'Too large or too small in comparison', definition_tr: 'Karşılaştırıldığında çok büyük veya çok küçük', example_en: 'The punishment was disproportionate to the crime.', part_of_speech: 'adjective' }
      ]
    };

    const levelWords = preDefinedWords[level] || preDefinedWords['B1'];
    // Shuffle the words array and select random words
    const shuffledWords = [...levelWords].sort(() => Math.random() - 0.5);
    const selectedWords = shuffledWords.slice(0, limit);
    
    return selectedWords.map(wordData => ({
      word: wordData.word,
      definition_en: wordData.definition_en,
      definition_tr: wordData.definition_tr,
      example_en: wordData.example_en,
      cefr_level: level,
      part_of_speech: wordData.part_of_speech,
      frequency_rank: this.estimateFrequencyRank(wordData.word)
    }));
  }
}

export const realTimeVocabularyAPI = new RealTimeVocabularyAPI();
export type { WordData, SearchResult };
export default realTimeVocabularyAPI;