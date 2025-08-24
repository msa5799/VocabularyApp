import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { Ionicons } from '@expo/vector-icons';
import realTimeVocabularyAPI, { SearchResult } from '../../services/api/realTimeVocabularyAPI';
import geminiAPIService, { WordAnalysis } from '../../services/api/geminiAPI';
import { firestoreService } from '../../services/storage/firestore';

interface Props {
  navigation: any;
  route: {
    params: {
      level?: string;
    };
  };
}

interface WordAssessment {
  word: SearchResult;
  known: boolean | null;
  confidence: number;
  geminiAnalysis?: WordAnalysis;
}

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 768;
const isMobile = width < 480;

const WordLearningScreen: React.FC<Props> = ({ navigation, route }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [words, setWords] = useState<SearchResult[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [assessments, setAssessments] = useState<WordAssessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDefinition, setShowDefinition] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [isSavingResults, setIsSavingResults] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [canNavigateBack, setCanNavigateBack] = useState(true);
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState<number>(5);
  const [personalizedPath, setPersonalizedPath] = useState<any>(null);
  const [sessionPerformance, setSessionPerformance] = useState<{
    correctCount: number;
    totalAnswered: number;
    averageConfidence: number;
    timeSpent: number;
  }>({ correctCount: 0, totalAnswered: 0, averageConfidence: 0, timeSpent: 0 });

  const level = route.params?.level || user?.current_level || 'A1';

  useEffect(() => {
    loadWordsForLevel();
  }, [level]);

  const loadWordsForLevel = async () => {
    setIsLoading(true);
    try {
      // Kullanıcının öğrendiği kelimeleri al
      let excludeWords: string[] = [];
      if (user?.firebase_uid) {
        const userWordLists = await firestoreService.getUserWordListsByFirebaseUid(user.firebase_uid);
        excludeWords = [
          ...userWordLists.learning.map(item => item.word.word),
          ...userWordLists.saved.map(item => item.word.word),
          ...userWordLists.mastered.map(item => item.word.word)
        ];
      }
      
      const levelWords = await realTimeVocabularyAPI.getWordsByLevel(level, 20, excludeWords);
      
      // AI-powered word sorting based on user level and difficulty
      const sortedWords = await sortWordsByAIDifficulty(levelWords);
      setWords(sortedWords);
      
      // Initialize assessments with Gemini AI analysis
      const initialAssessments = await Promise.all(
        sortedWords.map(async (word) => {
          let geminiAnalysis: WordAnalysis | undefined;
          try {
            // Get Gemini AI analysis for each word
            geminiAnalysis = await geminiAPIService.analyzeWord({
              word: word.word,
              userLevel: user?.current_level === 'A1' ? 'beginner' : 
                        user?.current_level === 'B1' || user?.current_level === 'B2' ? 'intermediate' : 'advanced'
            });
          } catch (error) {
            console.warn(`Gemini analysis failed for word: ${word.word}`, error);
          }
          
          return {
            word,
            known: null,
            confidence: 0,
            geminiAnalysis
          };
        })
      );
      
      setAssessments(initialAssessments);
      
      // Generate AI recommendations for the session
      await generateAIRecommendations(sortedWords);
      
    } catch (error) {
      console.error('Error loading words:', error);
      Alert.alert('Hata', 'Kelimeler yüklenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWordAssessment = (known: boolean, confidence: number = 3) => {
    const updatedAssessments = [...assessments];
    updatedAssessments[currentWordIndex] = {
      ...updatedAssessments[currentWordIndex],
      known,
      confidence
    };
    setAssessments(updatedAssessments);

    // Update session performance for AI adaptation
    const newPerformance = {
      correctCount: sessionPerformance.correctCount + (known ? 1 : 0),
      totalAnswered: sessionPerformance.totalAnswered + 1,
      averageConfidence: ((sessionPerformance.averageConfidence * sessionPerformance.totalAnswered) + confidence) / (sessionPerformance.totalAnswered + 1),
      timeSpent: sessionPerformance.timeSpent + 1 // Simplified time tracking
    };
    setSessionPerformance(newPerformance);

    // Adaptive difficulty adjustment based on performance
    adjustAdaptiveDifficulty(newPerformance);

    // Move to next word or complete session
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      setShowDefinition(false);
    } else {
      completeSession(updatedAssessments);
    }
  };

  const navigateToQuestion = (index: number) => {
    if (index >= 0 && index < words.length) {
      setCurrentWordIndex(index);
      setSidebarVisible(false);
      setShowDefinition(false);
    }
  };

  const goToPreviousWord = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1);
      setShowDefinition(false);
    }
  };

  const goToNextWord = () => {
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      setShowDefinition(false);
    }
  };

  const getWordStatus = (index: number) => {
    const assessment = assessments[index];
    if (!assessment || assessment.known === null) return 'unanswered';
    return assessment.known ? 'known' : 'unknown';
  };

  const completeSession = async (finalAssessments: WordAssessment[]) => {
    setIsSavingResults(true);
    const unknownWords = finalAssessments.filter(assessment => !assessment.known);
    const knownWords = finalAssessments.filter(assessment => assessment.known);

    try {
      if (!user?.firebase_uid) {
        Alert.alert('Hata', 'Kullanıcı oturumu bulunamadı.');
        return;
      }

      // Generate personalized learning path with AI
      if (unknownWords.length > 0) {
        try {
          const learningPath = await geminiAPIService.generateLearningPath({
            words: unknownWords.map(w => w.word.word),
            userLevel: user?.current_level === 'A1' ? 'beginner' : 
                      user?.current_level === 'B1' || user?.current_level === 'B2' ? 'intermediate' : 'advanced',
            learningGoals: ['vocabulary_expansion', 'retention_improvement'],
            weakAreas: getWeakAreasFromAssessments(finalAssessments)
          });
          setPersonalizedPath(learningPath);
        } catch (error) {
          console.warn('Failed to generate AI learning path:', error);
        }
      }

      // Save unknown words to learning list
      for (const assessment of unknownWords) {
        await firestoreService.addWordToListByFirebaseUid(user.firebase_uid, 'learning', {
          word: assessment.word.word,
          definition: assessment.word.definition_en,
          type: assessment.word.part_of_speech || '',
          example: assessment.word.example_en || '',
          level: assessment.word.cefr_level || 'A1'
        });
      }

      // Save known words to mastered list
      for (const assessment of knownWords) {
        await firestoreService.addWordToListByFirebaseUid(user.firebase_uid, 'mastered', {
          word: assessment.word.word,
          definition: assessment.word.definition_en,
          type: assessment.word.part_of_speech || '',
          example: assessment.word.example_en || '',
          level: assessment.word.cefr_level || 'A1'
        });
      }

      // Update user progress with AI insights
      const progress = {
        wordsLearned: knownWords.length,
        wordsToLearn: unknownWords.length,
        lastSessionDate: new Date().toISOString(),
        level: route.params?.level || 'A1',
        adaptiveDifficulty: adaptiveDifficulty,
        sessionPerformance: sessionPerformance
      };
      await firestoreService.updateUserProgressByFirebaseUid(user.firebase_uid, progress);

    } catch (error) {
      console.error('Error saving session results:', error);
      Alert.alert('Hata', 'Sonuçlar kaydedilirken bir hata oluştu.');
    } finally {
      setIsSavingResults(false);
    }

    setSessionComplete(true);
  };

  // AI-powered helper functions
  const sortWordsByAIDifficulty = async (words: SearchResult[]) => {
    try {
      const wordsWithDifficulty = await Promise.all(
        words.map(async (word) => {
          try {
            const difficulty = await geminiAPIService.getWordDifficulty(word.word);
            return { ...word, aiDifficulty: difficulty.score };
          } catch {
            return { ...word, aiDifficulty: 5 }; // Default difficulty
          }
        })
      );
      
      // Sort by adaptive difficulty
      return wordsWithDifficulty.sort((a, b) => {
        const targetDifficulty = adaptiveDifficulty;
        const diffA = Math.abs(a.aiDifficulty - targetDifficulty);
        const diffB = Math.abs(b.aiDifficulty - targetDifficulty);
        return diffA - diffB;
      });
    } catch {
      return words; // Return original order on error
    }
  };

  const generateAIRecommendations = async (words: SearchResult[]) => {
    try {
      const wordList = words.slice(0, 5).map(w => w.word);
      const recommendations = [
        `Bu seviyede ${wordList.length} kelime ile başlıyorsunuz.`,
        `Ortalama zorluk seviyeniz: ${adaptiveDifficulty}/10`,
        'AI, performansınıza göre kelime sırasını optimize etti.',
        'Her kelime için kişiselleştirilmiş öğrenme ipuçları hazırlandı.'
      ];
      setAiRecommendations(recommendations);
    } catch (error) {
      console.warn('Failed to generate AI recommendations:', error);
    }
  };

  const adjustAdaptiveDifficulty = (performance: typeof sessionPerformance) => {
    const successRate = performance.correctCount / Math.max(performance.totalAnswered, 1);
    const confidenceLevel = performance.averageConfidence;
    
    let newDifficulty = adaptiveDifficulty;
    
    if (successRate > 0.8 && confidenceLevel > 4) {
      // User is doing well, increase difficulty
      newDifficulty = Math.min(10, adaptiveDifficulty + 0.5);
    } else if (successRate < 0.4 || confidenceLevel < 2) {
      // User is struggling, decrease difficulty
      newDifficulty = Math.max(1, adaptiveDifficulty - 0.5);
    }
    
    setAdaptiveDifficulty(newDifficulty);
  };

  const getWeakAreasFromAssessments = (assessments: WordAssessment[]) => {
    const weakAreas = [];
    const unknownWords = assessments.filter(a => !a.known);
    
    if (unknownWords.length > assessments.length * 0.6) {
      weakAreas.push('vocabulary_retention');
    }
    if (unknownWords.some(w => w.geminiAnalysis?.difficultyScore && w.geminiAnalysis.difficultyScore < 5)) {
      weakAreas.push('basic_vocabulary');
    }
    
    return weakAreas;
  };

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

  const currentWord = words[currentWordIndex];
  const currentAssessment = assessments[currentWordIndex];
  const progress = ((currentWordIndex + 1) / words.length) * 100;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Kelimeler yükleniyor...</Text>
      </View>
    );
  }

  if (isSavingResults) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Sonuçlar hazırlanıyor...</Text>
        <Text style={styles.savingSubtext}>Kelimeleriniz listelere ekleniyor</Text>
      </View>
    );
  }

  if (sessionComplete) {
    const unknownCount = assessments.filter(a => !a.known).length;
    const knownCount = assessments.filter(a => a.known).length;

    return (
      <View style={styles.container}>
        <View style={styles.completionContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#10b981" />
          <Text style={styles.completionTitle}>Oturum Tamamlandı!</Text>
          <Text style={styles.completionSubtitle}>
            {knownCount} kelime biliyorsunuz, {unknownCount} kelime öğrenme listenize eklendi.
          </Text>
          
          <View style={styles.resultsContainer}>
            <View style={styles.resultCard}>
              <Ionicons name="checkmark-circle-outline" size={32} color="#10b981" />
              <Text style={styles.resultNumber}>{knownCount}</Text>
              <Text style={styles.resultLabel}>Bilinen</Text>
            </View>
            <View style={styles.resultCard}>
              <Ionicons name="school-outline" size={32} color="#f59e0b" />
              <Text style={styles.resultNumber}>{unknownCount}</Text>
              <Text style={styles.resultLabel}>Öğrenilecek</Text>
            </View>
          </View>

          {/* AI Learning Path Recommendations */}
          {personalizedPath && (
            <View style={styles.aiPathContainer}>
              <Text style={styles.aiPathTitle}>🎓 Kişiselleştirilmiş Öğrenme Planı</Text>
              <View style={styles.pathSchedule}>
                <Text style={styles.pathScheduleText}>
                  📅 {personalizedPath.schedule?.studyDuration || '15 dakika'} günlük çalışma
                </Text>
                <Text style={styles.pathScheduleText}>
                  📚 {personalizedPath.schedule?.wordsPerDay || 5} kelime/gün
                </Text>
                <Text style={styles.pathScheduleText}>
                  🎯 {personalizedPath.schedule?.totalDays || 7} günde tamamlanacak
                </Text>
              </View>
              {personalizedPath.milestones && personalizedPath.milestones.length > 0 && (
                <View style={styles.milestonesContainer}>
                  <Text style={styles.milestonesTitle}>🏆 Hedefler:</Text>
                  {personalizedPath.milestones.slice(0, 3).map((milestone: any, index: number) => (
                    <Text key={index} style={styles.milestoneText}>
                      • Gün {milestone.day}: {milestone.goal}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}

          <View style={styles.completionActions}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => navigation.navigate('WordLists')}
            >
              <Ionicons name="list" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.primaryButtonText}>Kelime Listelerime Git</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Dashboard')}
            >
              <Ionicons name="home" size={20} color="#6b7280" style={{ marginRight: 8 }} />
              <Text style={styles.secondaryButtonText}>Ana Sayfaya Dön</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.sidebarButton}
            onPress={() => setSidebarVisible(true)}
          >
            <Ionicons name="list" size={24} color="#6366f1" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>🤖 AI Kelime Öğrenme - {level}</Text>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>{currentWordIndex + 1}/{words.length}</Text>
          <Text style={styles.difficultyText}>Zorluk: {adaptiveDifficulty.toFixed(1)}/10</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      {/* AI Recommendations */}
      {aiRecommendations.length > 0 && currentWordIndex === 0 && (
        <View style={styles.aiRecommendationsContainer}>
          <Text style={styles.aiRecommendationsTitle}>🎯 AI Önerileri</Text>
          {aiRecommendations.map((recommendation, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.recommendationText}>{recommendation}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Performance Indicator */}
      {sessionPerformance.totalAnswered > 0 && (
        <View style={styles.performanceContainer}>
          <View style={styles.performanceItem}>
            <Ionicons name="trophy" size={20} color="#f59e0b" />
            <Text style={styles.performanceText}>
              Başarı: {Math.round((sessionPerformance.correctCount / sessionPerformance.totalAnswered) * 100)}%
            </Text>
          </View>
          <View style={styles.performanceItem}>
            <Ionicons name="trending-up" size={20} color="#6366f1" />
            <Text style={styles.performanceText}>
              Güven: {sessionPerformance.averageConfidence.toFixed(1)}/5
            </Text>
          </View>
        </View>
      )}

      {/* Sidebar */}
      {sidebarVisible && (
        <>
          <TouchableOpacity 
            style={styles.sidebarOverlay} 
            onPress={() => setSidebarVisible(false)}
          />
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>Kelime Listesi</Text>
              <Text style={styles.sidebarSubtitle}>{words.length} kelime</Text>
            </View>
            <ScrollView style={styles.sidebarContent}>
              {words.map((word, index) => {
                const status = getWordStatus(index);
                const isCurrent = index === currentWordIndex;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.wordListItem, isCurrent && styles.currentWordItem]}
                    onPress={() => navigateToQuestion(index)}
                  >
                    <View style={[
                      styles.wordItemNumber,
                      isCurrent && styles.currentWordNumber,
                      status === 'known' && styles.knownWordNumber,
                      status === 'unknown' && styles.unknownWordNumber
                    ]}>
                      <Text style={[
                        styles.wordItemNumberText,
                        isCurrent && styles.currentWordNumberText,
                        status === 'known' && styles.knownWordNumberText,
                        status === 'unknown' && styles.unknownWordNumberText
                      ]}>
                        {index + 1}
                      </Text>
                    </View>
                    <View style={styles.wordItemContent}>
                      <Text style={styles.wordItemText}>{word.word}</Text>
                      <Text style={styles.wordItemStatus}>
                        {status === 'known' ? 'Biliniyor' : 
                         status === 'unknown' ? 'Bilinmiyor' : 'Cevaplanmadı'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={styles.sidebarFooter}>
              <TouchableOpacity 
                style={styles.sidebarCloseButton}
                onPress={() => setSidebarVisible(false)}
              >
                <Text style={styles.sidebarCloseButtonText}>Kapat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* Word Card */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentWord && (
          <View style={styles.wordContainer}>
            <View style={styles.wordCard}>
              <View style={styles.wordHeader}>
                <Text style={styles.wordEnglish}>{currentWord.word}</Text>
                <View style={[styles.levelBadge, { backgroundColor: getLevelColor(currentWord.cefr_level || level) }]}>
                  <Text style={styles.levelText}>{currentWord.cefr_level || level}</Text>
                </View>
              </View>
              
              {currentWord.part_of_speech && (
                <Text style={styles.wordType}>{currentWord.part_of_speech}</Text>
              )}

              {showDefinition && (
                <View style={styles.definitionContainer}>
                  <Text style={styles.definitionTitle}>Anlamı:</Text>
                  <Text style={styles.definition}>{currentWord.definition_tr}</Text>
                  {currentWord.example_en && (
                    <View style={styles.exampleContainer}>
                      <Text style={styles.exampleTitle}>Örnek:</Text>
                      <Text style={styles.example}>{currentWord.example_en}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Gemini AI Analysis */}
              {currentAssessment?.geminiAnalysis && showDefinition && (
                <View style={styles.aiAnalysisContainer}>
                  <Text style={styles.aiAnalysisTitle}>🤖 AI Öğrenme Asistanı</Text>
                  
                  <View style={styles.aiSection}>
                    <Text style={styles.aiSectionTitle}>📊 Zorluk Seviyesi:</Text>
                    <Text style={styles.aiSectionText}>{currentAssessment.geminiAnalysis.cefrLevel} (Skor: {currentAssessment.geminiAnalysis.difficultyScore}/10)</Text>
                  </View>

                  <View style={styles.aiSection}>
                    <Text style={styles.aiSectionTitle}>🎯 Öğrenme Önceliği:</Text>
                    <Text style={styles.aiSectionText}>{currentAssessment.geminiAnalysis.learningPriority}</Text>
                  </View>

                  {currentAssessment.geminiAnalysis.memoryTechniques && currentAssessment.geminiAnalysis.memoryTechniques.length > 0 && (
                    <View style={styles.aiSection}>
                      <Text style={styles.aiSectionTitle}>🧠 Hafıza Teknikleri:</Text>
                      <Text style={styles.aiSectionText}>{currentAssessment.geminiAnalysis.memoryTechniques.join(', ')}</Text>
                    </View>
                  )}

                  {currentAssessment.geminiAnalysis.usageContext && (
                    <View style={styles.aiSection}>
                      <Text style={styles.aiSectionTitle}>📝 Kullanım Bağlamı:</Text>
                      <Text style={styles.aiSectionText}>{currentAssessment.geminiAnalysis.usageContext}</Text>
                    </View>
                  )}

                  {currentAssessment.geminiAnalysis.collocations && currentAssessment.geminiAnalysis.collocations.length > 0 && (
                    <View style={styles.aiSection}>
                      <Text style={styles.aiSectionTitle}>🔗 Yaygın Kullanımlar:</Text>
                      <Text style={styles.aiSectionText}>{currentAssessment.geminiAnalysis.collocations.join(', ')}</Text>
                    </View>
                  )}

                  {currentAssessment.geminiAnalysis.similarWords && currentAssessment.geminiAnalysis.similarWords.length > 0 && (
                    <View style={styles.aiSection}>
                      <Text style={styles.aiSectionTitle}>🔄 Benzer Kelimeler:</Text>
                      <Text style={styles.aiSectionText}>{currentAssessment.geminiAnalysis.similarWords.join(', ')}</Text>
                    </View>
                  )}

                  {currentAssessment.geminiAnalysis.learningTips && (
                    <View style={styles.aiSection}>
                      <Text style={styles.aiSectionTitle}>💡 Öğrenme İpuçları:</Text>
                      <Text style={styles.aiSectionText}>{currentAssessment.geminiAnalysis.learningTips}</Text>
                    </View>
                  )}

                  {currentAssessment.geminiAnalysis.explanation && (
                    <View style={styles.aiSection}>
                      <Text style={styles.aiSectionTitle}>📚 Açıklama:</Text>
                      <Text style={styles.aiSectionText}>{currentAssessment.geminiAnalysis.explanation}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Navigation Buttons */}
            <View style={styles.navigationButtons}>
              <TouchableOpacity
                style={[styles.navButton, currentWordIndex === 0 && styles.navButtonDisabled]}
                onPress={goToPreviousWord}
                disabled={currentWordIndex === 0}
              >
                <Ionicons name="chevron-back" size={16} color="#6b7280" />
                <Text style={styles.navButtonText}>Önceki</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.navButton, currentWordIndex === words.length - 1 && styles.navButtonDisabled]}
                onPress={goToNextWord}
                disabled={currentWordIndex === words.length - 1}
              >
                <Text style={styles.navButtonText}>Sonraki</Text>
                <Ionicons name="chevron-forward" size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Assessment Question */}
            <View style={styles.questionContainer}>
              <Text style={styles.questionText}>
                Bu kelimeyi biliyor musunuz?
              </Text>
              
              {!showDefinition ? (
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.knownButton]}
                    onPress={() => handleWordAssessment(true, 5)}
                  >
                    <Ionicons name="checkmark" size={24} color="#fff" />
                    <Text style={styles.actionButtonText}>Biliyorum</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.showButton]}
                    onPress={() => setShowDefinition(true)}
                  >
                    <Ionicons name="eye" size={24} color="#fff" />
                    <Text style={styles.actionButtonText}>Anlamını Gör</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.unknownButton]}
                    onPress={() => handleWordAssessment(false, 1)}
                  >
                    <Ionicons name="close" size={24} color="#fff" />
                    <Text style={styles.actionButtonText}>Bilmiyorum</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.knownButton]}
                    onPress={() => handleWordAssessment(true, 3)}
                  >
                    <Ionicons name="checkmark" size={24} color="#fff" />
                    <Text style={styles.actionButtonText}>Artık Biliyorum</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.unknownButton]}
                    onPress={() => handleWordAssessment(false, 1)}
                  >
                    <Ionicons name="school" size={24} color="#fff" />
                    <Text style={styles.actionButtonText}>Öğrenmem Gerek</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  savingSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: isMobile ? 16 : 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingTop: isMobile ? 50 : 20, // Safe area for mobile
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: isMobile ? 8 : 12,
  },
  sidebarButton: {
    padding: isMobile ? 6 : 8,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
  },
  headerTitle: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  progressContainer: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: isMobile ? 8 : 12,
    paddingVertical: isMobile ? 4 : 6,
    borderRadius: 12,
  },
  progressText: {
    fontSize: isMobile ? 12 : 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#e5e7eb',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6366f1',
  },
  content: {
    flex: 1,
    padding: isMobile ? 16 : 20,
  },
  wordContainer: {
    flex: 1,
  },
  wordCard: {
    backgroundColor: '#fff',
    padding: isMobile ? 16 : 24,
    borderRadius: isMobile ? 12 : 16,
    marginBottom: isMobile ? 16 : 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  wordEnglish: {
    fontSize: isMobile ? 22 : 28,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  levelBadge: {
    paddingHorizontal: isMobile ? 8 : 12,
    paddingVertical: isMobile ? 4 : 6,
    borderRadius: isMobile ? 12 : 16,
  },
  levelText: {
    fontSize: isMobile ? 12 : 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  wordType: {
    fontSize: isMobile ? 14 : 16,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: isMobile ? 12 : 16,
  },
  definitionContainer: {
    marginTop: isMobile ? 12 : 16,
    padding: isMobile ? 12 : 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  definitionTitle: {
    fontSize: isMobile ? 14 : 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: isMobile ? 6 : 8,
  },
  definition: {
    fontSize: isMobile ? 16 : 18,
    color: '#1f2937',
    lineHeight: isMobile ? 22 : 24,
  },
  exampleContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 6,
  },
  example: {
    fontSize: 16,
    color: '#374151',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  questionContainer: {
    backgroundColor: '#fff',
    padding: isMobile ? 16 : 24,
    borderRadius: isMobile ? 12 : 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  questionText: {
    fontSize: isMobile ? 18 : 20,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: isMobile ? 16 : 24,
  },
  actionButtons: {
    gap: 12,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    minWidth: 100,
    justifyContent: 'center',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginHorizontal: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: isMobile ? 12 : 16,
    borderRadius: isMobile ? 8 : 12,
    gap: isMobile ? 6 : 8,
  },
  knownButton: {
    backgroundColor: '#10b981',
  },
  unknownButton: {
    backgroundColor: '#ef4444',
  },
  showButton: {
    backgroundColor: '#6366f1',
  },
  actionButtonText: {
    fontSize: isMobile ? 14 : 16,
    fontWeight: '600',
    color: '#fff',
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: isMobile ? 20 : 40,
  },
  completionTitle: {
    fontSize: isMobile ? 22 : 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: isMobile ? 16 : 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  completionSubtitle: {
    fontSize: isMobile ? 14 : 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: isMobile ? 20 : 24,
    marginBottom: isMobile ? 24 : 32,
  },
  resultsContainer: {
    flexDirection: isMobile ? 'column' : 'row',
    gap: isMobile ? 12 : 20,
    marginBottom: isMobile ? 24 : 40,
    width: isMobile ? '100%' : 'auto',
  },
  resultCard: {
    backgroundColor: '#fff',
    padding: isMobile ? 16 : 24,
    borderRadius: isMobile ? 12 : 16,
    alignItems: 'center',
    minWidth: isMobile ? 'auto' : 120,
    flex: isMobile ? 1 : 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resultNumber: {
    fontSize: isMobile ? 24 : 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginVertical: isMobile ? 4 : 8,
  },
  resultLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  completionActions: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  aiAnalysisContainer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  aiAnalysisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0c4a6e',
    marginBottom: 16,
    textAlign: 'center',
  },
  aiSection: {
    marginBottom: 12,
  },
  aiSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 4,
  },
  aiSectionText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  difficultyText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  aiRecommendationsContainer: {
    backgroundColor: '#f0f9ff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  aiRecommendationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  performanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f9fafb',
    margin: 16,
    marginTop: 0,
    padding: 12,
    borderRadius: 8,
  },
  performanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  performanceText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 6,
    fontWeight: '500',
  },
  aiPathContainer: {
    backgroundColor: '#fef3c7',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  aiPathTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 12,
  },
  pathSchedule: {
    marginBottom: 12,
  },
  pathScheduleText: {
    fontSize: 14,
    color: '#78350f',
    marginBottom: 4,
  },
  milestonesContainer: {
    marginTop: 8,
  },
  milestonesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 6,
  },
  milestoneText: {
    fontSize: 13,
    color: '#78350f',
    marginBottom: 2,
  },
  // Sidebar styles
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: isMobile ? width * 0.85 : 280,
    height: '100%',
    backgroundColor: '#fff',
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sidebarHeader: {
    padding: isMobile ? 16 : 20,
    paddingTop: isMobile ? 50 : 20, // Safe area for mobile
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  sidebarTitle: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: isMobile ? 6 : 8,
  },
  sidebarSubtitle: {
    fontSize: isMobile ? 12 : 14,
    color: '#6b7280',
  },
  sidebarContent: {
    flex: 1,
  },
  wordListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: isMobile ? 12 : 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  currentWordItem: {
    backgroundColor: '#f0f9ff',
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  wordItemNumber: {
    width: isMobile ? 28 : 32,
    height: isMobile ? 28 : 32,
    borderRadius: isMobile ? 14 : 16,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: isMobile ? 8 : 12,
  },
  currentWordNumber: {
    backgroundColor: '#6366f1',
  },
  knownWordNumber: {
    backgroundColor: '#10b981',
  },
  unknownWordNumber: {
    backgroundColor: '#ef4444',
  },
  wordItemNumberText: {
    fontSize: isMobile ? 12 : 14,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  currentWordNumberText: {
    color: '#fff',
  },
  knownWordNumberText: {
    color: '#fff',
  },
  unknownWordNumberText: {
    color: '#fff',
  },
  wordItemContent: {
    flex: 1,
  },
  wordItemText: {
    fontSize: isMobile ? 14 : 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  wordItemStatus: {
    fontSize: isMobile ? 11 : 12,
    color: '#6b7280',
    marginTop: 2,
  },
  sidebarFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  sidebarCloseButton: {
    backgroundColor: '#6366f1',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  sidebarCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WordLearningScreen;