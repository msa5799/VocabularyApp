import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// CEFR Level type definition
type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

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

interface MyMemoryResponse {
  responseData: {
    translatedText: string;
    match: number;
  };
  quotaFinished: boolean;
  mtLangSupported: boolean;
  responseDetails: string;
  responseStatus: number;
  responderId: string;
  exception_code?: string;
  matches: Array<{
    id: string;
    segment: string;
    translation: string;
    source: string;
    target: string;
    quality: string;
    reference: string;
    usage_count: number;
    subject: string;
    created_by: string;
    last_updated_by: string;
    create_date: string;
    last_update_date: string;
    match: number;
  }>;
}

interface WordData {
  word: string;
  cefr_level: CEFRLevel;
  part_of_speech: string;
  definition_en: string;
  definition_tr: string;
  example_sentence: string;
  frequency_rank: number;
}

class WordDataImprover {
  private readonly dictionaryAPI = 'https://api.dictionaryapi.dev/api/v2/entries/en';
  private readonly translationAPI = 'https://api.mymemory.translated.net/get';
  private readonly delay = 1000; // 1 saniye bekleme süresi API rate limit için

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async fetchWordDefinition(word: string): Promise<WordAPIResponse | null> {
    try {
      console.log(`Fetching definition for: ${word}`);
      const response = await fetch(`${this.dictionaryAPI}/${encodeURIComponent(word)}`);
      
      if (!response.ok) {
        console.warn(`Dictionary API request failed for word: ${word} (${response.status})`);
        return null;
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data[0] : data;
    } catch (error) {
      console.error(`Error fetching definition for ${word}:`, error);
      return null;
    }
  }

  private async translateToTurkish(text: string): Promise<string> {
    try {
      console.log(`Translating to Turkish: ${text.substring(0, 50)}...`);
      const encodedText = encodeURIComponent(text);
      const url = `${this.translationAPI}?q=${encodedText}&langpair=en|tr`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.warn(`Translation API request failed (${response.status})`);
        return `${text} (çeviri alınamadı)`;
      }
      
      const data: MyMemoryResponse = await response.json();
      
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        return data.responseData.translatedText;
      } else {
        console.warn(`Translation failed for: ${text}`);
        return `${text} (çeviri alınamadı)`;
      }
    } catch (error) {
      console.error(`Error translating text: ${text}`, error);
      return `${text} (çeviri hatası)`;
    }
  }

  private async improveWordData(wordData: WordData): Promise<WordData> {
    console.log(`\nImproving data for word: ${wordData.word}`);
    
    // API'den kelime tanımını çek
    const apiData = await this.fetchWordDefinition(wordData.word);
    await this.sleep(this.delay); // Rate limit için bekle
    
    let improvedData = { ...wordData };
    
    if (apiData && apiData.meanings && apiData.meanings.length > 0) {
      const meaning = apiData.meanings[0];
      
      // Part of speech güncelle
      if (meaning.partOfSpeech) {
        improvedData.part_of_speech = meaning.partOfSpeech;
      }
      
      // Definition güncelle
      if (meaning.definitions && meaning.definitions.length > 0) {
        const definition = meaning.definitions[0];
        
        if (definition.definition && 
            !definition.definition.includes('Definition for') && 
            definition.definition.length > 10) {
          improvedData.definition_en = definition.definition;
        }
        
        // Example sentence güncelle
        if (definition.example && 
            !definition.example.includes('Example sentence with') &&
            definition.example.length > 10) {
          improvedData.example_sentence = definition.example;
        }
      }
    }
    
    // Türkçe çeviri güncelle (eğer jenerik ise)
    if (improvedData.definition_tr.includes('(Türkçe çeviri)') || 
        improvedData.definition_tr.includes('(çeviri bulunamadı)') ||
        improvedData.definition_tr === wordData.word) {
      
      const turkishTranslation = await this.translateToTurkish(wordData.word);
      await this.sleep(this.delay); // Rate limit için bekle
      
      if (turkishTranslation && !turkishTranslation.includes('çeviri alınamadı')) {
        improvedData.definition_tr = turkishTranslation;
      }
    }
    
    // Example sentence'i Türkçe'ye çevir (eğer İngilizce ise)
    if (improvedData.example_sentence && 
        !improvedData.example_sentence.includes('Example sentence with') &&
        improvedData.example_sentence.length > 10) {
      
      // Örnek cümleyi Türkçe'ye çevir
      const turkishExample = await this.translateToTurkish(improvedData.example_sentence);
      await this.sleep(this.delay); // Rate limit için bekle
      
      if (turkishExample && !turkishExample.includes('çeviri alınamadı')) {
        // Hem İngilizce hem Türkçe örneği sakla
        improvedData.example_sentence = `${improvedData.example_sentence} | ${turkishExample}`;
      }
    }
    
    console.log(`Improved data for ${wordData.word}:`);
    console.log(`- Definition: ${improvedData.definition_en.substring(0, 50)}...`);
    console.log(`- Turkish: ${improvedData.definition_tr}`);
    console.log(`- Example: ${improvedData.example_sentence.substring(0, 50)}...`);
    
    return improvedData;
  }

  async improveWordsFile(): Promise<void> {
    try {
      console.log('Starting words data improvement process...');
      
      // Mevcut words.json dosyasını oku
      const wordsFilePath = path.join(__dirname, '../data/words.json');
      const wordsFileContent = fs.readFileSync(wordsFilePath, 'utf8');
      const wordsData = JSON.parse(wordsFileContent);
      
      console.log(`Found ${wordsData.words.length} words to improve`);
      
      const improvedWords: WordData[] = [];
      
      // Her kelime için veri kalitesini iyileştir
      for (let i = 0; i < wordsData.words.length; i++) {
        const word = wordsData.words[i];
        console.log(`\nProcessing ${i + 1}/${wordsData.words.length}: ${word.word}`);
        
        try {
          const improvedWord = await this.improveWordData(word);
          improvedWords.push(improvedWord);
          
          // Her 10 kelimede bir progress göster
          if ((i + 1) % 10 === 0) {
            console.log(`\n✅ Processed ${i + 1}/${wordsData.words.length} words`);
          }
          
        } catch (error) {
          console.error(`Error improving word ${word.word}:`, error);
          // Hata durumunda orijinal veriyi koru
          improvedWords.push(word);
        }
      }
      
      // İyileştirilmiş veriyi kaydet
      const improvedWordsData = {
        words: improvedWords
      };
      
      const backupPath = path.join(__dirname, '../data/words_backup.json');
      const newWordsPath = path.join(__dirname, '../data/words_improved.json');
      
      // Backup oluştur
      fs.writeFileSync(backupPath, wordsFileContent, 'utf8');
      console.log(`\n📁 Backup created at: ${backupPath}`);
      
      // İyileştirilmiş veriyi kaydet
      fs.writeFileSync(newWordsPath, JSON.stringify(improvedWordsData, null, 2), 'utf8');
      console.log(`\n✅ Improved words data saved to: ${newWordsPath}`);
      
      console.log('\n🎉 Words data improvement completed!');
      console.log(`📊 Total words processed: ${improvedWords.length}`);
      
    } catch (error) {
      console.error('Error improving words file:', error);
      throw error;
    }
  }
}

// Script'i çalıştır
const improver = new WordDataImprover();
improver.improveWordsFile()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

export { WordDataImprover };