import realTimeVocabularyAPI, { SearchResult } from '../api/realTimeVocabularyAPI';
import geminiAPIService, { WordAnalysis } from '../api/geminiAPI';
import { CEFRLevel } from '../../types/database';

export interface AssessmentQuestion {
  id: string;
  word: SearchResult;
  type: 'definition' | 'synonym' | 'antonym' | 'usage' | 'translation';
  question: string;
  options: string[];
  correctAnswer: number;
  level: CEFRLevel;
  difficulty: number; // 1-10 scale
  geminiAnalysis?: WordAnalysis;
}

export interface AssessmentResult {
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  estimatedLevel: CEFRLevel;
  levelScores: { [key in CEFRLevel]: number };
  detailedAnalysis: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    vocabularyGaps: string[];
  };
  questionResults: {
    questionId: string;
    correct: boolean;
    timeSpent: number;
    difficulty: number;
    level: CEFRLevel;
  }[];
}

export interface AssessmentConfig {
  totalQuestions: number;
  questionsPerLevel: { [key in CEFRLevel]: number };
  questionTypes: ('definition' | 'synonym' | 'antonym' | 'usage' | 'translation')[];
  adaptiveMode: boolean; // Adjust difficulty based on performance
  timeLimit?: number; // seconds per question
}

class VocabularyAssessmentService {
  private readonly defaultConfig: AssessmentConfig = {
    totalQuestions: 50,
    questionsPerLevel: {
      'A1': 8,
      'A2': 8,
      'B1': 10,
      'B2': 10,
      'C1': 8,
      'C2': 6
    },
    questionTypes: ['definition', 'synonym', 'usage', 'translation'],
    adaptiveMode: true,
    timeLimit: 60
  };

  private readonly levelWords: { [key in CEFRLevel]: string[] } = {
    'A1': [
      'house', 'family', 'work', 'school', 'friend', 'food', 'water', 'time',
      'good', 'bad', 'big', 'small', 'new', 'old', 'happy', 'sad',
      'go', 'come', 'see', 'know', 'think', 'want', 'need', 'like'
    ],
    'A2': [
      'important', 'different', 'possible', 'available', 'necessary', 'difficult',
      'comfortable', 'successful', 'popular', 'expensive', 'dangerous', 'beautiful',
      'develop', 'improve', 'increase', 'decrease', 'create', 'produce',
      'experience', 'opportunity', 'situation', 'information', 'education', 'government'
    ],
    'B1': [
      'significant', 'appropriate', 'particular', 'specific', 'general', 'individual',
      'professional', 'traditional', 'international', 'environmental', 'economic', 'political',
      'establish', 'maintain', 'achieve', 'require', 'involve', 'consider',
      'responsibility', 'relationship', 'communication', 'organization', 'development', 'management'
    ],
    'B2': [
      'comprehensive', 'substantial', 'considerable', 'sophisticated', 'innovative', 'strategic',
      'fundamental', 'essential', 'crucial', 'vital', 'critical', 'significant',
      'implement', 'facilitate', 'demonstrate', 'evaluate', 'analyze', 'synthesize',
      'methodology', 'infrastructure', 'sustainability', 'competitiveness', 'effectiveness', 'efficiency'
    ],
    'C1': [
      'unprecedented', 'paradigm', 'ubiquitous', 'meticulous', 'intricate', 'profound',
      'inherent', 'implicit', 'explicit', 'coherent', 'comprehensive', 'exhaustive',
      'scrutinize', 'substantiate', 'corroborate', 'consolidate', 'perpetuate', 'culminate',
      'phenomenon', 'hypothesis', 'methodology', 'epistemology', 'ontology', 'taxonomy'
    ],
    'C2': [
      'ephemeral', 'ubiquitous', 'perspicacious', 'sagacious', 'erudite', 'pedantic',
      'surreptitious', 'clandestine', 'ostentatious', 'pretentious', 'magnanimous', 'parsimonious',
      'obfuscate', 'elucidate', 'extrapolate', 'interpolate', 'juxtapose', 'synthesize',
      'zeitgeist', 'schadenfreude', 'weltanschauung', 'bildungsroman', 'leitmotif', 'denouement'
    ]
  };

  async generateAssessment(config: Partial<AssessmentConfig> = {}): Promise<AssessmentQuestion[]> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const questions: AssessmentQuestion[] = [];

    for (const [level, count] of Object.entries(finalConfig.questionsPerLevel)) {
      const cefrLevel = level as CEFRLevel;
      const levelQuestions = await this.generateQuestionsForLevel(cefrLevel, count, finalConfig.questionTypes);
      questions.push(...levelQuestions);
    }

    // Shuffle questions to avoid level-based patterns
    return this.shuffleArray(questions);
  }

  private async generateQuestionsForLevel(
    level: CEFRLevel,
    count: number,
    questionTypes: string[]
  ): Promise<AssessmentQuestion[]> {
    const questions: AssessmentQuestion[] = [];
    const levelWords = this.levelWords[level];
    const selectedWords = this.shuffleArray([...levelWords]).slice(0, count);

    for (let i = 0; i < selectedWords.length; i++) {
      const word = selectedWords[i];
      try {
        // Get word data from API
        const wordData = await realTimeVocabularyAPI.searchWords(word, 1);
        if (wordData.length === 0) continue;

        const primaryWord = wordData[0];
        
        // Get AI analysis for better question generation
        let geminiAnalysis: WordAnalysis | undefined;
        try {
          geminiAnalysis = await geminiAPIService.analyzeWord({ word: primaryWord.word });
        } catch (error) {
          console.warn('Failed to get Gemini analysis for word:', word);
        }

        // Generate different types of questions
        const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)] as any;
        const question = await this.generateQuestionByType(primaryWord, questionType, level, geminiAnalysis);
        
        if (question) {
          questions.push(question);
        }
      } catch (error) {
        console.error('Error generating question for word:', word, error);
      }
    }

    return questions;
  }

  private async generateQuestionByType(
    word: SearchResult,
    type: 'definition' | 'synonym' | 'antonym' | 'usage' | 'translation',
    level: CEFRLevel,
    geminiAnalysis?: WordAnalysis
  ): Promise<AssessmentQuestion | null> {
    const questionId = `${word.word}_${type}_${Date.now()}`;
    const difficulty = this.calculateDifficulty(level, geminiAnalysis?.difficultyScore);

    switch (type) {
      case 'definition':
        return this.generateDefinitionQuestion(questionId, word, level, difficulty, geminiAnalysis);
      case 'synonym':
        return this.generateSynonymQuestion(questionId, word, level, difficulty, geminiAnalysis);
      case 'usage':
        return this.generateUsageQuestion(questionId, word, level, difficulty, geminiAnalysis);
      case 'translation':
        return this.generateTranslationQuestion(questionId, word, level, difficulty, geminiAnalysis);
      default:
        return this.generateDefinitionQuestion(questionId, word, level, difficulty, geminiAnalysis);
    }
  }

  private generateDefinitionQuestion(
    id: string,
    word: SearchResult,
    level: CEFRLevel,
    difficulty: number,
    geminiAnalysis?: WordAnalysis
  ): AssessmentQuestion {
    const correctDefinition = word.definition_en || word.definition_tr;
    const distractors = this.generateDefinitionDistractors(word, level);
    
    const options = this.shuffleArray([correctDefinition, ...distractors]);
    const correctAnswer = options.indexOf(correctDefinition);

    return {
      id,
      word,
      type: 'definition',
      question: `What does "${word.word}" mean?`,
      options,
      correctAnswer,
      level,
      difficulty,
      geminiAnalysis
    };
  }

  private generateSynonymQuestion(
    id: string,
    word: SearchResult,
    level: CEFRLevel,
    difficulty: number,
    geminiAnalysis?: WordAnalysis
  ): AssessmentQuestion {
    // This would need a synonym database or API call
    // For now, fallback to definition question
    return this.generateDefinitionQuestion(id, word, level, difficulty, geminiAnalysis);
  }

  private generateUsageQuestion(
    id: string,
    word: SearchResult,
    level: CEFRLevel,
    difficulty: number,
    geminiAnalysis?: WordAnalysis
  ): AssessmentQuestion {
    const example = word.example_en || `The ${word.word} is very important.`;
    const blankedExample = example.replace(new RegExp(word.word, 'gi'), '____');
    
    const distractors = this.generateWordDistractors(word, level);
    const options = this.shuffleArray([word.word, ...distractors]);
    const correctAnswer = options.indexOf(word.word);

    return {
      id,
      word,
      type: 'usage',
      question: `Complete the sentence: "${blankedExample}"`,
      options,
      correctAnswer,
      level,
      difficulty,
      geminiAnalysis
    };
  }

  private generateTranslationQuestion(
    id: string,
    word: SearchResult,
    level: CEFRLevel,
    difficulty: number,
    geminiAnalysis?: WordAnalysis
  ): AssessmentQuestion {
    const correctTranslation = word.definition_tr || 'çeviri';
    const distractors = this.generateTranslationDistractors(word, level);
    
    const options = this.shuffleArray([correctTranslation, ...distractors]);
    const correctAnswer = options.indexOf(correctTranslation);

    return {
      id,
      word,
      type: 'translation',
      question: `"${word.word}" kelimesinin Türkçe karşılığı nedir?`,
      options,
      correctAnswer,
      level,
      difficulty,
      geminiAnalysis
    };
  }

  private generateDefinitionDistractors(word: SearchResult, level: CEFRLevel): string[] {
    // Generate plausible but incorrect definitions
    const distractors = [
      'a type of building or structure',
      'a method or way of doing something',
      'a person who performs a specific role'
    ];
    return distractors.slice(0, 3);
  }

  private generateWordDistractors(word: SearchResult, level: CEFRLevel): string[] {
    const levelWords = this.levelWords[level];
    return levelWords.filter(w => w !== word.word).slice(0, 3);
  }

  private generateTranslationDistractors(word: SearchResult, level: CEFRLevel): string[] {
    const distractors = ['yapı', 'yöntem', 'kişi', 'durum', 'sistem', 'süreç'];
    return distractors.slice(0, 3);
  }

  private calculateDifficulty(level: CEFRLevel, geminiScore?: number): number {
    const baseDifficulty = {
      'A1': 2,
      'A2': 3,
      'B1': 5,
      'B2': 6,
      'C1': 8,
      'C2': 9
    }[level];

    return geminiScore ? Math.round((baseDifficulty + geminiScore) / 2) : baseDifficulty;
  }

  evaluateAssessment(
    questions: AssessmentQuestion[],
    answers: number[],
    timings: number[]
  ): AssessmentResult {
    const questionResults = questions.map((question, index) => ({
      questionId: question.id,
      correct: answers[index] === question.correctAnswer,
      timeSpent: timings[index] || 0,
      difficulty: question.difficulty,
      level: question.level
    }));

    const correctAnswers = questionResults.filter(r => r.correct).length;
    const scorePercentage = Math.round((correctAnswers / questions.length) * 100);

    // Calculate level scores
    const levelScores: { [key in CEFRLevel]: number } = {
      'A1': 0, 'A2': 0, 'B1': 0, 'B2': 0, 'C1': 0, 'C2': 0
    };

    questionResults.forEach(result => {
      if (result.correct) {
        levelScores[result.level]++;
      }
    });

    // Estimate level based on performance
    const estimatedLevel = this.estimateLevel(levelScores, scorePercentage);

    // Generate detailed analysis
    const detailedAnalysis = this.generateDetailedAnalysis(questionResults, questions);

    return {
      totalQuestions: questions.length,
      correctAnswers,
      scorePercentage,
      estimatedLevel,
      levelScores,
      detailedAnalysis,
      questionResults
    };
  }

  private estimateLevel(levelScores: { [key in CEFRLevel]: number }, scorePercentage: number): CEFRLevel {
    // Advanced level estimation algorithm
    const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    
    // Check from highest to lowest level
    for (let i = levels.length - 1; i >= 0; i--) {
      const level = levels[i];
      const requiredScore = this.getRequiredScoreForLevel(level);
      const levelPerformance = levelScores[level];
      const totalLevelQuestions = this.defaultConfig.questionsPerLevel[level];
      const levelPercentage = (levelPerformance / totalLevelQuestions) * 100;
      
      if (levelPercentage >= requiredScore && scorePercentage >= this.getMinimumOverallScore(level)) {
        return level;
      }
    }
    
    return 'A1'; // Default to A1 if no level criteria met
  }

  private getRequiredScoreForLevel(level: CEFRLevel): number {
    const requirements = {
      'A1': 50,
      'A2': 60,
      'B1': 65,
      'B2': 70,
      'C1': 75,
      'C2': 80
    };
    return requirements[level];
  }

  private getMinimumOverallScore(level: CEFRLevel): number {
    const minimums = {
      'A1': 40,
      'A2': 50,
      'B1': 60,
      'B2': 70,
      'C1': 75,
      'C2': 80
    };
    return minimums[level];
  }

  private generateDetailedAnalysis(
    questionResults: any[],
    questions: AssessmentQuestion[]
  ) {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];
    const vocabularyGaps: string[] = [];

    // Analyze performance by question type
    const typePerformance = this.analyzeByType(questionResults, questions);
    const levelPerformance = this.analyzeByLevel(questionResults, questions);

    // Generate insights based on performance
    Object.entries(typePerformance).forEach(([type, performance]) => {
      if (performance.percentage >= 70) {
        strengths.push(`Strong ${type} recognition skills`);
      } else if (performance.percentage < 50) {
        weaknesses.push(`Needs improvement in ${type} questions`);
        recommendations.push(`Practice more ${type}-based exercises`);
      }
    });

    Object.entries(levelPerformance).forEach(([level, performance]) => {
      if (performance.percentage < 50) {
        vocabularyGaps.push(`${level} level vocabulary needs attention`);
        recommendations.push(`Focus on ${level} level word acquisition`);
      }
    });

    return {
      strengths,
      weaknesses,
      recommendations,
      vocabularyGaps
    };
  }

  private analyzeByType(questionResults: any[], questions: AssessmentQuestion[]) {
    const typeStats: { [key: string]: { correct: number; total: number; percentage: number } } = {};
    
    questions.forEach((question, index) => {
      const type = question.type;
      if (!typeStats[type]) {
        typeStats[type] = { correct: 0, total: 0, percentage: 0 };
      }
      
      typeStats[type].total++;
      if (questionResults[index].correct) {
        typeStats[type].correct++;
      }
    });

    Object.keys(typeStats).forEach(type => {
      typeStats[type].percentage = (typeStats[type].correct / typeStats[type].total) * 100;
    });

    return typeStats;
  }

  private analyzeByLevel(questionResults: any[], questions: AssessmentQuestion[]) {
    const levelStats: { [key: string]: { correct: number; total: number; percentage: number } } = {};
    
    questions.forEach((question, index) => {
      const level = question.level;
      if (!levelStats[level]) {
        levelStats[level] = { correct: 0, total: 0, percentage: 0 };
      }
      
      levelStats[level].total++;
      if (questionResults[index].correct) {
        levelStats[level].correct++;
      }
    });

    Object.keys(levelStats).forEach(level => {
      levelStats[level].percentage = (levelStats[level].correct / levelStats[level].total) * 100;
    });

    return levelStats;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

export const vocabularyAssessmentService = new VocabularyAssessmentService();
export default vocabularyAssessmentService;