// Backend API base URL
const API_BASE_URL = 'http://localhost:3001';

export interface WordAnalysis {
  word: string;
  cefrLevel: string;
  difficultyScore: number;
  learningPriority: 'high' | 'medium' | 'low';
  memoryTechniques: string[];
  usageContext: string;
  collocations: string[];
  similarWords: string[];
  learningTips: string;
  explanation: string;
  rawResponse?: string;
}

export interface LearningPathItem {
  word: string;
  priority: number;
  studyDay: number;
  techniques: string[];
  exercises: string[];
  reviewDays: number[];
}

export interface LearningSchedule {
  wordsPerDay: number;
  studyDuration: string;
  totalDays: number;
}

export interface LearningMilestone {
  day: number;
  goal: string;
  assessment: string;
}

export interface PersonalizedLearningPath {
  learningPath: LearningPathItem[];
  schedule: LearningSchedule;
  milestones: LearningMilestone[];
  rawResponse?: string;
}

export interface WordLearningRequest {
  word: string;
  userLevel?: 'beginner' | 'intermediate' | 'advanced';
  context?: string;
}

export interface LearningPathRequest {
  words: string[];
  userLevel?: 'beginner' | 'intermediate' | 'advanced';
  learningGoals?: string[];
  weakAreas?: string[];
}

class GeminiAPIService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Retry function with exponential backoff for rate limiting
   */
  private async retryWithBackoff<T>(fn: () => Promise<T>, maxRetries: number = 3): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        if (error.message.includes('429') && i < maxRetries - 1) {
          const delay = Math.pow(2, i) * 1000 + Math.random() * 1000; // Exponential backoff with jitter
          console.log(`Rate limit hit, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
    throw new Error('Max retries exceeded');
  }

  /**
   * Analyze a word using Gemini AI to get learning insights
   */
  async analyzeWord(request: WordLearningRequest): Promise<WordAnalysis> {
    try {
      const result = await this.retryWithBackoff(async () => {
        const response = await fetch(`${this.baseURL}/api/word-learning-assistant`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response;
      });

      const response = result;
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Word analysis failed');
      }

      return data.analysis;
    } catch (error) {
      console.error('Error analyzing word:', error);
      throw error;
    }
  }

  /**
   * Generate a personalized learning path using Gemini AI
   */
  async generateLearningPath(request: LearningPathRequest): Promise<PersonalizedLearningPath> {
    try {
      const result = await this.retryWithBackoff(async () => {
        const response = await fetch(`${this.baseURL}/api/personalized-learning-path`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response;
      });

      const response = result;

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Learning path generation failed');
      }

      return data.learningPath;
    } catch (error) {
      console.error('Error generating learning path:', error);
      throw error;
    }
  }

  /**
   * Batch analyze multiple words
   */
  async analyzeWords(words: string[], userLevel?: string): Promise<WordAnalysis[]> {
    try {
      const analyses = await Promise.all(
        words.map(word => 
          this.analyzeWord({ 
            word, 
            userLevel: userLevel as 'beginner' | 'intermediate' | 'advanced' 
          })
        )
      );
      return analyses;
    } catch (error) {
      console.error('Error analyzing words:', error);
      throw error;
    }
  }

  /**
   * Get word difficulty level for sorting/filtering
   */
  async getWordDifficulty(word: string): Promise<{ level: string; score: number }> {
    try {
      const analysis = await this.analyzeWord({ word });
      return {
        level: analysis.cefrLevel,
        score: analysis.difficultyScore
      };
    } catch (error) {
      console.error('Error getting word difficulty:', error);
      // Return default values on error
      return {
        level: 'B1',
        score: 5
      };
    }
  }
}

export const geminiAPIService = new GeminiAPIService();
export default geminiAPIService;