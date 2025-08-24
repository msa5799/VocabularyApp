import { Word, CEFRLevel } from '../types/database';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

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

class WordGenerator {
  private readonly baseURL = 'https://api.dictionaryapi.dev/api/v2/entries/en';
  
  private readonly wordsByLevel: Record<CEFRLevel, string[]> = {
    A1: [
      'hello', 'goodbye', 'yes', 'no', 'please', 'thank', 'sorry', 'excuse',
      'name', 'age', 'family', 'mother', 'father', 'brother', 'sister', 'child',
      'house', 'home', 'room', 'kitchen', 'bedroom', 'bathroom', 'garden',
      'school', 'teacher', 'student', 'book', 'pen', 'paper', 'table', 'chair',
      'food', 'water', 'bread', 'milk', 'coffee', 'tea', 'apple', 'banana',
      'cat', 'dog', 'bird', 'fish', 'car', 'bus', 'train', 'plane',
      'red', 'blue', 'green', 'yellow', 'black', 'white', 'big', 'small',
      'good', 'bad', 'happy', 'sad', 'hot', 'cold', 'new', 'old',
      'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
      'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
    ],
    A2: [
      'beautiful', 'interesting', 'important', 'different', 'difficult', 'easy',
      'expensive', 'cheap', 'dangerous', 'safe', 'comfortable', 'uncomfortable',
      'weather', 'sunny', 'rainy', 'cloudy', 'windy', 'snowy', 'temperature',
      'season', 'spring', 'summer', 'autumn', 'winter', 'holiday', 'vacation',
      'restaurant', 'hotel', 'shop', 'market', 'bank', 'hospital', 'pharmacy',
      'clothes', 'shirt', 'dress', 'shoes', 'hat', 'jacket', 'trousers',
      'breakfast', 'lunch', 'dinner', 'hungry', 'thirsty', 'delicious', 'taste',
      'travel', 'journey', 'ticket', 'passport', 'luggage', 'airport', 'station',
      'money', 'price', 'buy', 'sell', 'pay', 'cost', 'free', 'expensive',
      'health', 'doctor', 'medicine', 'pain', 'headache', 'fever', 'tired'
    ],
    B1: [
      'environment', 'pollution', 'climate', 'global', 'natural', 'resource',
      'technology', 'computer', 'internet', 'website', 'software', 'digital',
      'education', 'university', 'degree', 'graduate', 'research', 'knowledge',
      'business', 'company', 'office', 'manager', 'employee', 'customer',
      'government', 'politics', 'election', 'democracy', 'citizen', 'society',
      'culture', 'tradition', 'custom', 'festival', 'celebration', 'ceremony',
      'relationship', 'friendship', 'marriage', 'divorce', 'partner', 'colleague',
      'communication', 'conversation', 'discussion', 'argument', 'opinion', 'advice',
      'experience', 'skill', 'ability', 'talent', 'achievement', 'success',
      'problem', 'solution', 'decision', 'choice', 'opportunity', 'challenge'
    ],
    B2: [
      'sophisticated', 'comprehensive', 'substantial', 'significant', 'considerable',
      'phenomenon', 'consequence', 'implication', 'perspective', 'approach',
      'methodology', 'analysis', 'evaluation', 'assessment', 'interpretation',
      'innovation', 'development', 'advancement', 'progress', 'evolution',
      'sustainability', 'responsibility', 'accountability', 'transparency', 'integrity',
      'collaboration', 'cooperation', 'coordination', 'negotiation', 'compromise',
      'diversity', 'inclusion', 'equality', 'discrimination', 'prejudice',
      'psychology', 'behavior', 'personality', 'emotion', 'motivation',
      'philosophy', 'ethics', 'morality', 'principle', 'value',
      'economics', 'finance', 'investment', 'budget', 'revenue', 'profit'
    ],
    C1: [
      'unprecedented', 'paradigm', 'infrastructure', 'bureaucracy', 'hierarchy',
      'jurisdiction', 'legislation', 'regulation', 'implementation', 'enforcement',
      'entrepreneurship', 'capitalism', 'socialism', 'globalization', 'urbanization',
      'demographic', 'statistical', 'empirical', 'theoretical', 'hypothetical',
      'sophisticated', 'intricate', 'elaborate', 'comprehensive', 'extensive',
      'fundamental', 'essential', 'crucial', 'vital', 'indispensable',
      'controversial', 'contentious', 'debatable', 'ambiguous', 'paradoxical',
      'revolutionary', 'evolutionary', 'transformative', 'innovative', 'pioneering',
      'sustainability', 'biodiversity', 'ecosystem', 'conservation', 'preservation',
      'intellectual', 'cognitive', 'psychological', 'philosophical', 'ideological'
    ],
    C2: [
      'quintessential', 'ubiquitous', 'ephemeral', 'perpetual', 'immutable',
      'juxtaposition', 'dichotomy', 'synthesis', 'antithesis', 'dialectical',
      'epistemology', 'ontology', 'phenomenology', 'hermeneutics', 'semiotics',
      'hegemony', 'sovereignty', 'autonomy', 'legitimacy', 'accountability',
      'meritocracy', 'plutocracy', 'oligarchy', 'autocracy', 'totalitarian',
      'existential', 'transcendental', 'metaphysical', 'empirical', 'rational',
      'pragmatic', 'utilitarian', 'egalitarian', 'libertarian', 'authoritarian',
      'indigenous', 'cosmopolitan', 'metropolitan', 'provincial', 'parochial',
      'unprecedented', 'unparalleled', 'incomparable', 'incommensurable', 'ineffable',
      'serendipitous', 'fortuitous', 'propitious', 'auspicious', 'ominous'
    ]
  };

  private readonly turkishTranslations: Record<string, string> = {
    // A1 Level
    'hello': 'merhaba',
    'goodbye': 'hoşçakal, güle güle',
    'yes': 'evet',
    'no': 'hayır',
    'please': 'lütfen',
    'thank': 'teşekkür etmek',
    'sorry': 'üzgünüm, özür dilerim',
    'excuse': 'mazeret, bahane',
    'name': 'isim, ad',
    'age': 'yaş',
    'family': 'aile',
    'mother': 'anne',
    'father': 'baba',
    'brother': 'erkek kardeş',
    'sister': 'kız kardeş',
    'child': 'çocuk',
    'house': 'ev',
    'home': 'ev, yuva',
    'room': 'oda',
    'kitchen': 'mutfak',
    'bedroom': 'yatak odası',
    'bathroom': 'banyo',
    'garden': 'bahçe',
    'school': 'okul',
    'teacher': 'öğretmen',
    'student': 'öğrenci',
    'book': 'kitap',
    'pen': 'kalem',
    'paper': 'kağıt',
    'table': 'masa',
    'chair': 'sandalye',
    'food': 'yemek',
    'water': 'su',
    'bread': 'ekmek',
    'milk': 'süt',
    'coffee': 'kahve',
    'tea': 'çay',
    'apple': 'elma',
    'banana': 'muz',
    'cat': 'kedi',
    'dog': 'köpek',
    'bird': 'kuş',
    'fish': 'balık',
    'car': 'araba',
    'bus': 'otobüs',
    'train': 'tren',
    'plane': 'uçak',
    'red': 'kırmızı',
    'blue': 'mavi',
    'green': 'yeşil',
    'yellow': 'sarı',
    'black': 'siyah',
    'white': 'beyaz',
    'big': 'büyük',
    'small': 'küçük',
    'good': 'iyi',
    'bad': 'kötü',
    'happy': 'mutlu',
    'sad': 'üzgün',
    'hot': 'sıcak',
    'cold': 'soğuk',
    'new': 'yeni',
    'old': 'eski',
    'one': 'bir',
    'two': 'iki',
    'three': 'üç',
    'four': 'dört',
    'five': 'beş',
    'six': 'altı',
    'seven': 'yedi',
    'eight': 'sekiz',
    'nine': 'dokuz',
    'ten': 'on',
    // A2 Level
    'beautiful': 'güzel',
    'interesting': 'ilginç',
    'important': 'önemli',
    'different': 'farklı',
    'difficult': 'zor',
    'easy': 'kolay',
    'expensive': 'pahalı',
    'cheap': 'ucuz',
    'dangerous': 'tehlikeli',
    'safe': 'güvenli',
    'comfortable': 'rahat',
    'weather': 'hava durumu',
    'sunny': 'güneşli',
    'rainy': 'yağmurlu',
    'cloudy': 'bulutlu',
    'restaurant': 'restoran',
    'hotel': 'otel',
    'shop': 'dükkan',
    'market': 'market',
    'bank': 'banka',
    'hospital': 'hastane',
    'clothes': 'kıyafet',
    'travel': 'seyahat',
    'money': 'para',
    'health': 'sağlık',
    'doctor': 'doktor',
    // B1 Level
    'environment': 'çevre',
    'pollution': 'kirlilik',
    'technology': 'teknoloji',
    'computer': 'bilgisayar',
    'internet': 'internet',
    'education': 'eğitim',
    'university': 'üniversite',
    'business': 'iş, ticaret',
    'government': 'hükümet',
    'culture': 'kültür',
    'relationship': 'ilişki',
    'communication': 'iletişim',
    'experience': 'deneyim',
    'problem': 'problem',
    // B2 Level
    'sophisticated': 'karmaşık, gelişmiş',
    'comprehensive': 'kapsamlı',
    'significant': 'önemli, anlamlı',
    'phenomenon': 'olgu, fenomen',
    'innovation': 'yenilik',
    'sustainability': 'sürdürülebilirlik',
    'collaboration': 'işbirliği',
    'diversity': 'çeşitlilik',
    'psychology': 'psikoloji',
    'philosophy': 'felsefe',
    'economics': 'ekonomi',
    // C1 Level
    'unprecedented': 'emsalsiz, benzeri görülmemiş',
    'paradigm': 'paradigma, örnek',
    'infrastructure': 'altyapı',
    'bureaucracy': 'bürokrasi',
    'jurisdiction': 'yargı yetkisi',
    'entrepreneurship': 'girişimcilik',
    'globalization': 'küreselleşme',
    'demographic': 'demografik',
    'fundamental': 'temel',
    'controversial': 'tartışmalı',
    // C2 Level
    'quintessential': 'özünde olan, tipik',
    'ubiquitous': 'her yerde bulunan',
    'ephemeral': 'geçici, kısa süreli',
    'juxtaposition': 'yan yana koyma',
    'epistemology': 'bilgi felsefesi',
    'hegemony': 'hegemonya',
    'meritocracy': 'liyakat sistemi',
    'existential': 'varoluşsal',
    'indigenous': 'yerli, doğal',
    'serendipitous': 'tesadüfi, şanslı'
  };

  async fetchWordDefinition(word: string): Promise<WordAPIResponse | null> {
    try {
      const response = await fetch(`${this.baseURL}/${word}`);
      if (response.ok) {
        const data = await response.json();
        return data[0] || null;
      }
    } catch (error) {
      console.error(`API error for word ${word}:`, error);
    }
    return null;
  }

  private getFrequencyRank(word: string, level: CEFRLevel): number {
    const levelRanks = {
      A1: 1000,
      A2: 2000,
      B1: 3000,
      B2: 4000,
      C1: 5000,
      C2: 6000
    };
    
    const baseRank = levelRanks[level];
    const wordIndex = this.wordsByLevel[level].indexOf(word);
    return baseRank + wordIndex;
  }

  private getTurkishTranslation(word: string): string {
    return this.turkishTranslations[word] || `${word} (çeviri bulunamadı)`;
  }

  async generateWordsForLevel(level: CEFRLevel, count: number = 50): Promise<Omit<Word, 'id' | 'created_at'>[]> {
    const words: Omit<Word, 'id' | 'created_at'>[] = [];
    const levelWords = this.wordsByLevel[level];
    const selectedWords = levelWords.slice(0, Math.min(count, levelWords.length));

    console.log(`Generating ${selectedWords.length} words for level ${level} from API...`);

    for (const word of selectedWords) {
      try {
        let definition_en = '';
        let example_en = '';
        let pronunciation = '';
        let part_of_speech = 'noun';

        // API'den kelime tanımını çek
        const apiData = await this.fetchWordDefinition(word);
        
        if (apiData && apiData.meanings && apiData.meanings.length > 0) {
          const meaning = apiData.meanings[0];
          part_of_speech = meaning.partOfSpeech || 'noun';
          
          if (meaning.definitions && meaning.definitions.length > 0) {
            definition_en = meaning.definitions[0].definition;
            example_en = meaning.definitions[0].example || '';
          }
        }

        if (apiData && apiData.phonetic) {
          pronunciation = apiData.phonetic;
        } else if (apiData && apiData.phonetics && apiData.phonetics.length > 0) {
          pronunciation = apiData.phonetics[0].text || '';
        }

        // Fallback definitions if API fails
        if (!definition_en) {
          definition_en = `Definition for ${word}`;
        }

        const wordData: Omit<Word, 'id' | 'created_at'> = {
          word: word,
          definition_en: definition_en,
          definition_tr: this.getTurkishTranslation(word),
          example_en: example_en || `Example sentence with ${word}.`,
          example_tr: `${word} kelimesi ile örnek cümle.`,
          pronunciation: pronunciation,
          cefr_level: level,
          part_of_speech: part_of_speech,
          frequency_rank: this.getFrequencyRank(word, level)
        };

        words.push(wordData);
        
        // API rate limiting - kısa bekleme
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error processing word ${word}:`, error);
        
        // Hata durumunda basit veri oluştur
        const fallbackWord: Omit<Word, 'id' | 'created_at'> = {
          word: word,
          definition_en: `Definition for ${word}`,
          definition_tr: this.getTurkishTranslation(word),
          example_en: `Example sentence with ${word}.`,
          example_tr: `${word} kelimesi ile örnek cümle.`,
          pronunciation: '',
          cefr_level: level,
          part_of_speech: 'noun',
          frequency_rank: this.getFrequencyRank(word, level)
        };
        
        words.push(fallbackWord);
      }
    }

    console.log(`Generated ${words.length} words for level ${level}`);
    return words;
  }

  async generateAllLevelsWords(): Promise<Omit<Word, 'id' | 'created_at'>[]> {
    const allWords: Omit<Word, 'id' | 'created_at'>[] = [];
    const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    
    console.log('Generating words for all levels from API...');
    
    for (const level of levels) {
      const wordsForLevel = await this.generateWordsForLevel(level, 30);
      allWords.push(...wordsForLevel);
    }
    
    console.log(`Generated total ${allWords.length} words from API`);
    return allWords;
  }

  async saveWordsToJSON(words: Omit<Word, 'id' | 'created_at'>[]): Promise<void> {
    try {
      const wordsData = {
        words: words,
        generated_at: new Date().toISOString(),
        total_count: words.length
      };
      
      const jsonContent = JSON.stringify(wordsData, null, 2);
      
      if (Platform.OS === 'web') {
        // Web platformunda console'a yazdır (manuel kopyalama için)
        console.log('=== WORDS JSON DATA ===');
        console.log(jsonContent);
        console.log('=== END WORDS JSON DATA ===');
        
        // localStorage'a da kaydet
        localStorage.setItem('vocabulary_words', jsonContent);
        console.log('Words saved to localStorage and printed to console');
      } else {
        // Mobil platformlarda FileSystem kullan
        const fileUri = FileSystem.documentDirectory + 'words.json';
        await FileSystem.writeAsStringAsync(fileUri, jsonContent);
        console.log(`Words saved to file: ${fileUri}`);
      }
    } catch (error) {
      console.error('Error saving words to JSON:', error);
    }
  }
}

// Ana fonksiyon - kelimeleri oluştur ve kaydet
export async function generateAndSaveWords(): Promise<void> {
  const generator = new WordGenerator();
  
  console.log('Starting word generation process...');
  const words = await generator.generateAllLevelsWords();
  
  console.log('Saving words to JSON...');
  await generator.saveWordsToJSON(words);
  
  console.log('Word generation process completed!');
}

// Eğer bu dosya doğrudan çalıştırılırsa
if (require.main === module) {
  generateAndSaveWords().catch(console.error);
}