import * as fs from 'fs';
import * as path from 'path';

type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

interface WordData {
  word: string;
  cefr_level: CEFRLevel;
  part_of_speech: string;
  definition_en: string;
  definition_tr: string;
  example_sentence: string;
  frequency_rank: number;
}

class WordGenerator {
  private readonly API_BASE_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';
  
  // CEFR seviyelerine göre kelime listeleri
  private readonly wordsByLevel: Record<CEFRLevel, string[]> = {
    A1: ['hello', 'goodbye', 'yes', 'no', 'please', 'thank', 'family', 'house', 'school', 'book', 'water', 'food', 'time', 'day', 'night', 'good', 'bad', 'big', 'small', 'new', 'old', 'happy', 'sad', 'hot', 'cold', 'eat', 'drink', 'go', 'come', 'see'],
    A2: ['beautiful', 'important', 'weather', 'restaurant', 'travel', 'money', 'work', 'friend', 'country', 'city', 'language', 'music', 'sport', 'holiday', 'shopping', 'clothes', 'color', 'number', 'letter', 'question', 'answer', 'problem', 'solution', 'idea', 'story', 'movie', 'game', 'party', 'gift', 'surprise'],
    B1: ['environment', 'technology', 'education', 'business', 'culture', 'society', 'government', 'economy', 'health', 'medicine', 'science', 'research', 'development', 'progress', 'success', 'failure', 'opportunity', 'challenge', 'experience', 'knowledge', 'skill', 'ability', 'talent', 'creativity', 'imagination', 'memory', 'attention', 'focus', 'concentration', 'motivation'],
    B2: ['sophisticated', 'comprehensive', 'phenomenon', 'innovation', 'collaboration', 'communication', 'relationship', 'responsibility', 'independence', 'confidence', 'personality', 'character', 'behavior', 'attitude', 'emotion', 'feeling', 'thought', 'opinion', 'belief', 'value', 'principle', 'philosophy', 'psychology', 'sociology', 'anthropology', 'archaeology', 'history', 'geography', 'literature', 'poetry'],
    C1: ['unprecedented', 'paradigm', 'infrastructure', 'entrepreneurship', 'fundamental', 'theoretical', 'practical', 'analytical', 'critical', 'logical', 'rational', 'emotional', 'intellectual', 'spiritual', 'physical', 'mental', 'psychological', 'philosophical', 'scientific', 'technological', 'economic', 'political', 'social', 'cultural', 'environmental', 'international', 'global', 'universal', 'specific', 'general'],
    C2: ['quintessential', 'ubiquitous', 'ephemeral', 'juxtaposition', 'hegemony', 'dichotomy', 'paradox', 'irony', 'metaphor', 'allegory', 'symbolism', 'rhetoric', 'eloquence', 'articulate', 'verbose', 'concise', 'ambiguous', 'explicit', 'implicit', 'subtle', 'nuanced', 'sophisticated', 'elaborate', 'intricate', 'complex', 'complicated', 'convoluted', 'straightforward', 'transparent', 'opaque']
  };

  // Türkçe çeviriler
  private readonly turkishTranslations: Record<string, string> = {
    'hello': 'merhaba',
    'goodbye': 'hoşçakal',
    'yes': 'evet',
    'no': 'hayır',
    'please': 'lütfen',
    'thank': 'teşekkür etmek',
    'family': 'aile',
    'house': 'ev',
    'school': 'okul',
    'book': 'kitap',
    'beautiful': 'güzel',
    'important': 'önemli',
    'weather': 'hava durumu',
    'restaurant': 'restoran',
    'travel': 'seyahat etmek',
    'environment': 'çevre',
    'technology': 'teknoloji',
    'education': 'eğitim',
    'business': 'iş',
    'culture': 'kültür',
    'sophisticated': 'sofistike',
    'comprehensive': 'kapsamlı',
    'phenomenon': 'olgu',
    'innovation': 'yenilik',
    'collaboration': 'işbirliği',
    'unprecedented': 'emsalsiz',
    'paradigm': 'paradigma',
    'infrastructure': 'altyapı',
    'entrepreneurship': 'girişimcilik',
    'fundamental': 'temel',
    'quintessential': 'özünde olan',
    'ubiquitous': 'her yerde bulunan',
    'ephemeral': 'geçici',
    'juxtaposition': 'yan yana koyma',
    'hegemony': 'hegemonya'
  };

  private async fetchWordDefinition(word: string): Promise<any> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/${word}`);
      if (response.ok) {
        const data = await response.json();
        return data[0]; // İlk sonucu al
      }
    } catch (error) {
      console.error(`Error fetching definition for ${word}:`, error);
    }
    return null;
  }

  private getTurkishTranslation(word: string): string {
    return this.turkishTranslations[word] || `${word} (Türkçe çeviri)`;
  }

  private getFrequencyRank(word: string, level: CEFRLevel): number {
    const levelRanks: Record<CEFRLevel, number> = {
      A1: 1,
      A2: 1000,
      B1: 2000,
      B2: 3000,
      C1: 4000,
      C2: 5000
    };
    
    const baseRank = levelRanks[level];
    const levelWords = this.wordsByLevel[level];
    const wordIndex = levelWords.indexOf(word);
    
    return baseRank + wordIndex;
  }

  async generateWordsForLevel(level: CEFRLevel, count: number = 10): Promise<WordData[]> {
    const words: WordData[] = [];
    const levelWords = this.wordsByLevel[level];
    const selectedWords = levelWords.slice(0, Math.min(count, levelWords.length));

    console.log(`Generating ${selectedWords.length} words for level ${level} from API...`);

    for (const word of selectedWords) {
      try {
        let definition_en = '';
        let example_sentence = '';
        let part_of_speech = 'noun';

        // API'den kelime tanımını çek
        const apiData = await this.fetchWordDefinition(word);
        
        if (apiData && apiData.meanings && apiData.meanings.length > 0) {
          const meaning = apiData.meanings[0];
          part_of_speech = meaning.partOfSpeech || 'noun';
          
          if (meaning.definitions && meaning.definitions.length > 0) {
            definition_en = meaning.definitions[0].definition;
            example_sentence = meaning.definitions[0].example || `Example sentence with ${word}.`;
          }
        }

        // Fallback definitions if API fails
        if (!definition_en) {
          definition_en = `Definition for ${word}`;
        }

        const wordData: WordData = {
          word: word,
          cefr_level: level,
          part_of_speech: part_of_speech,
          definition_en: definition_en,
          definition_tr: this.getTurkishTranslation(word),
          example_sentence: example_sentence,
          frequency_rank: this.getFrequencyRank(word, level)
        };

        words.push(wordData);
        
        // API rate limiting - kısa bekleme
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`Error processing word ${word}:`, error);
        
        // Hata durumunda basit veri oluştur
        const fallbackWord: WordData = {
          word: word,
          cefr_level: level,
          part_of_speech: 'noun',
          definition_en: `Definition for ${word}`,
          definition_tr: this.getTurkishTranslation(word),
          example_sentence: `Example sentence with ${word}.`,
          frequency_rank: this.getFrequencyRank(word, level)
        };
        
        words.push(fallbackWord);
      }
    }

    console.log(`Generated ${words.length} words for level ${level}`);
    return words;
  }

  async generateAllLevelsWords(): Promise<WordData[]> {
    const allWords: WordData[] = [];
    const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    
    console.log('Generating words for all levels from API...');
    
    for (const level of levels) {
      const wordsForLevel = await this.generateWordsForLevel(level, 10); // Her seviyeden 10 kelime
      allWords.push(...wordsForLevel);
    }
    
    console.log(`Generated total ${allWords.length} words from API`);
    return allWords;
  }

  async saveWordsToJSON(words: WordData[]): Promise<void> {
    try {
      const wordsData = {
        words: words,
        generated_at: new Date().toISOString(),
        total_count: words.length
      };
      
      // Proje içindeki JSON dosyasına kaydet
      const currentDir = path.dirname(new URL(import.meta.url).pathname);
      const projectJsonPath = path.join(currentDir, '../data/words.json');
      fs.writeFileSync(projectJsonPath, JSON.stringify(wordsData, null, 2));
      console.log(`Words saved to ${projectJsonPath}`);
      
    } catch (error) {
      console.error('Error saving words to JSON:', error);
    }
  }
}

// Ana fonksiyon
export async function generateAndSaveWords(): Promise<void> {
  const generator = new WordGenerator();
  
  try {
    console.log('Starting word generation process...');
    const words = await generator.generateAllLevelsWords();
    await generator.saveWordsToJSON(words);
    console.log('Word generation completed successfully!');
  } catch (error) {
    console.error('Error in word generation process:', error);
  }
}

// Eğer bu dosya doğrudan çalıştırılırsa
if (import.meta.url === `file://${process.argv[1]}`) {
  generateAndSaveWords();
}