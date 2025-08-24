import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { CEFRLevel } from '../../types/database';
import { updateWordProgress } from '../../store/slices/progressSlice';
import { updateUserLevel as updateUserLevelAction } from '../../store/slices/authSlice';
import { databaseService } from '../../services/storage/database';
// webStorageService removed - using Firestore only
import { Platform } from 'react-native';

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 768;
const isMobile = width < 480;

interface Props {
  navigation: any;
  route: {
    params: {
      testType: 'level_test' | 'daily_practice' | 'review';
      testId?: number;
    };
  };
}

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  level: CEFRLevel;
  type: 'vocabulary' | 'grammar' | 'reading';
}

interface TestResult {
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  estimatedLevel: CEFRLevel;
  levelScores: { [key in CEFRLevel]: number };
}

const TestScreen: React.FC<Props> = ({ navigation, route }) => {
  const { testType, testId } = route.params;
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [canNavigateBack, setCanNavigateBack] = useState(false);

  const getTestTitle = () => {
    switch (testType) {
      case 'level_test':
        return 'CEFR Seviye Tespit Sınavı';
      case 'daily_practice':
        return 'Günlük Pratik';
      case 'review':
        return 'Tekrar';
      default:
        return 'Test';
    }
  };

  // Seviye tespit sınavı soruları üretici (Backend API'den)
  const generateLevelTestQuestions = async (): Promise<Question[]> => {
    try {
      const response = await fetch('http://localhost:3001/api/generate-level-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success && data.questions) {
        return data.questions;
      } else {
        throw new Error('Failed to generate questions from API');
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      
      // Fallback: return sample questions if API fails (50 questions - TOEFL/IELTS standards)
      const fallbackQuestions: Question[] = [
        // A1 Level Questions (8 questions)
        {
          id: 1,
          question: "Choose the correct article: ___ apple is red.",
          options: ["An", "A", "The", "No article"],
          correctAnswer: 0,
          level: 'A1',
          type: 'grammar'
        },
        {
          id: 2,
          question: "What is the plural of 'child'?",
          options: ["childs", "children", "childes", "child"],
          correctAnswer: 1,
          level: 'A1',
          type: 'vocabulary'
        },
        {
          id: 3,
          question: "I ___ from Turkey.",
          options: ["am", "is", "are", "be"],
          correctAnswer: 0,
          level: 'A1',
          type: 'grammar'
        },
        {
          id: 4,
          question: "What does 'enormous' mean?",
          options: ["very small", "very large", "medium", "colorful"],
          correctAnswer: 1,
          level: 'A1',
          type: 'vocabulary'
        },
        {
          id: 5,
          question: "She ___ to school every day.",
          options: ["go", "goes", "going", "gone"],
          correctAnswer: 1,
          level: 'A1',
          type: 'grammar'
        },
        {
          id: 6,
          question: "Choose the opposite of 'expensive':",
          options: ["costly", "cheap", "valuable", "precious"],
          correctAnswer: 1,
          level: 'A1',
          type: 'vocabulary'
        },
        {
          id: 7,
          question: "___ you speak English?",
          options: ["Do", "Does", "Are", "Is"],
          correctAnswer: 0,
          level: 'A1',
          type: 'grammar'
        },
        {
          id: 8,
          question: "What does 'frequently' mean?",
          options: ["rarely", "never", "often", "sometimes"],
          correctAnswer: 2,
          level: 'A1',
          type: 'vocabulary'
        },
        // A2 Level Questions (8 questions)
        {
          id: 9,
          question: "I have ___ this movie before.",
          options: ["see", "saw", "seen", "seeing"],
          correctAnswer: 2,
          level: 'A2',
          type: 'grammar'
        },
        {
          id: 10,
          question: "What does 'accomplish' mean?",
          options: ["to fail", "to achieve", "to begin", "to forget"],
          correctAnswer: 1,
          level: 'A2',
          type: 'vocabulary'
        },
        {
          id: 11,
          question: "If it ___ tomorrow, we will stay home.",
          options: ["rain", "rains", "will rain", "rained"],
          correctAnswer: 1,
          level: 'A2',
          type: 'grammar'
        },
        {
          id: 12,
          question: "Choose the synonym for 'adequate':",
          options: ["insufficient", "excessive", "suitable", "inappropriate"],
          correctAnswer: 2,
          level: 'A2',
          type: 'vocabulary'
        },
        {
          id: 13,
          question: "She is ___ intelligent than her brother.",
          options: ["more", "most", "much", "many"],
          correctAnswer: 0,
          level: 'A2',
          type: 'grammar'
        },
        {
          id: 14,
          question: "What does 'demonstrate' mean?",
          options: ["to hide", "to show", "to question", "to ignore"],
          correctAnswer: 1,
          level: 'A2',
          type: 'vocabulary'
        },
        {
          id: 15,
          question: "I ___ working here for five years.",
          options: ["am", "have been", "was", "will be"],
          correctAnswer: 1,
          level: 'A2',
          type: 'grammar'
        },
        {
          id: 16,
          question: "Choose the antonym for 'temporary':",
          options: ["brief", "permanent", "short", "momentary"],
          correctAnswer: 1,
          level: 'A2',
          type: 'vocabulary'
        },
        // B1 Level Questions (10 questions)
        {
          id: 17,
          question: "If I ___ you, I would accept the offer.",
          options: ["am", "was", "were", "be"],
          correctAnswer: 2,
          level: 'B1',
          type: 'grammar'
        },
        {
          id: 18,
          question: "What does 'substantial' mean?",
          options: ["minimal", "considerable", "temporary", "superficial"],
          correctAnswer: 1,
          level: 'B1',
          type: 'vocabulary'
        },
        {
          id: 19,
          question: "The report ___ by the committee next week.",
          options: ["will review", "will be reviewed", "will reviewing", "will have review"],
          correctAnswer: 1,
          level: 'B1',
          type: 'grammar'
        },
        {
          id: 20,
          question: "Choose the synonym for 'meticulous':",
          options: ["careless", "thorough", "hasty", "superficial"],
          correctAnswer: 1,
          level: 'B1',
          type: 'vocabulary'
        },
        {
          id: 21,
          question: "Despite ___ hard, he failed the exam.",
          options: ["study", "studying", "studied", "to study"],
          correctAnswer: 1,
          level: 'B1',
          type: 'grammar'
        },
        {
          id: 22,
          question: "What does 'deteriorate' mean?",
          options: ["to improve", "to worsen", "to maintain", "to enhance"],
          correctAnswer: 1,
          level: 'B1',
          type: 'vocabulary'
        },
        {
          id: 23,
          question: "I wish I ___ more time to finish the project.",
          options: ["have", "had", "will have", "would have"],
          correctAnswer: 1,
          level: 'B1',
          type: 'grammar'
        },
        {
          id: 24,
          question: "Choose the correct meaning of 'ambiguous':",
          options: ["clear", "uncertain", "obvious", "definite"],
          correctAnswer: 1,
          level: 'B1',
          type: 'vocabulary'
        },
        {
          id: 25,
          question: "The meeting ___ for two hours when I arrived.",
          options: ["was going on", "had been going on", "has been going on", "will be going on"],
          correctAnswer: 1,
          level: 'B1',
          type: 'grammar'
        },
        {
          id: 26,
          question: "What does 'inevitable' mean?",
          options: ["avoidable", "uncertain", "unavoidable", "optional"],
          correctAnswer: 2,
          level: 'B1',
          type: 'vocabulary'
        },
        // B2 Level Questions (10 questions)
        {
          id: 27,
          question: "___ the difficulties, the project was completed on time.",
          options: ["Despite", "Although", "In spite", "Regardless"],
          correctAnswer: 0,
          level: 'B2',
          type: 'grammar'
        },
        {
          id: 28,
          question: "What does 'comprehensive' mean?",
          options: ["partial", "complete", "simple", "basic"],
          correctAnswer: 1,
          level: 'B2',
          type: 'vocabulary'
        },
        {
          id: 29,
          question: "By the time you arrive, I ___ the presentation.",
          options: ["will finish", "will have finished", "will be finishing", "finish"],
          correctAnswer: 1,
          level: 'B2',
          type: 'grammar'
        },
        {
          id: 30,
          question: "Choose the synonym for 'prevalent':",
          options: ["rare", "common", "unusual", "exceptional"],
          correctAnswer: 1,
          level: 'B2',
          type: 'vocabulary'
        },
        {
          id: 31,
          question: "Not only ___ late, but he also forgot his presentation.",
          options: ["he was", "was he", "he is", "is he"],
          correctAnswer: 1,
          level: 'B2',
          type: 'grammar'
        },
        {
          id: 32,
          question: "What does 'scrutinize' mean?",
          options: ["to ignore", "to examine closely", "to approve quickly", "to reject"],
          correctAnswer: 1,
          level: 'B2',
          type: 'vocabulary'
        },
        {
          id: 33,
          question: "The proposal ___ by the board before implementation.",
          options: ["must approve", "must be approved", "must have approved", "must approving"],
          correctAnswer: 1,
          level: 'B2',
          type: 'grammar'
        },
        {
          id: 34,
          question: "Choose the antonym for 'coherent':",
          options: ["logical", "consistent", "disjointed", "organized"],
          correctAnswer: 2,
          level: 'B2',
          type: 'vocabulary'
        },
        {
          id: 35,
          question: "Should you ___ any problems, please contact us immediately.",
          options: ["encounter", "encountered", "encountering", "to encounter"],
          correctAnswer: 0,
          level: 'B2',
          type: 'grammar'
        },
        {
          id: 36,
          question: "What does 'facilitate' mean?",
          options: ["to hinder", "to make easier", "to complicate", "to prevent"],
          correctAnswer: 1,
          level: 'B2',
          type: 'vocabulary'
        },
        // C1 Level Questions (8 questions)
        {
          id: 37,
          question: "___ the weather been better, we would have gone hiking.",
          options: ["If", "Had", "Should", "Would"],
          correctAnswer: 1,
          level: 'C1',
          type: 'grammar'
        },
        {
          id: 38,
          question: "What does 'unprecedented' mean?",
          options: ["common", "never done before", "well-known", "traditional"],
          correctAnswer: 1,
          level: 'C1',
          type: 'vocabulary'
        },
        {
          id: 39,
          question: "Little ___ that this decision would change everything.",
          options: ["he knew", "did he know", "he knows", "does he know"],
          correctAnswer: 1,
          level: 'C1',
          type: 'grammar'
        },
        {
          id: 40,
          question: "Choose the synonym for 'ubiquitous':",
          options: ["rare", "omnipresent", "limited", "scarce"],
          correctAnswer: 1,
          level: 'C1',
          type: 'vocabulary'
        },
        {
          id: 41,
          question: "The research ___ significant implications for future studies.",
          options: ["has", "have", "having", "to have"],
          correctAnswer: 0,
          level: 'C1',
          type: 'grammar'
        },
        {
          id: 42,
          question: "What does 'paradigm' mean?",
          options: ["a small example", "a typical model", "an unusual case", "a simple solution"],
          correctAnswer: 1,
          level: 'C1',
          type: 'vocabulary'
        },
        {
          id: 43,
          question: "So complex ___ the issue that experts disagree.",
          options: ["is", "was", "are", "were"],
          correctAnswer: 0,
          level: 'C1',
          type: 'grammar'
        },
        {
          id: 44,
          question: "Choose the correct meaning of 'ephemeral':",
          options: ["permanent", "short-lived", "eternal", "stable"],
          correctAnswer: 1,
          level: 'C1',
          type: 'vocabulary'
        },
        // C2 Level Questions (6 questions)
        {
          id: 45,
          question: "The nuances of the argument were ___ to most listeners.",
          options: ["obvious", "imperceptible", "clear", "simple"],
          correctAnswer: 1,
          level: 'C2',
          type: 'vocabulary'
        },
        {
          id: 46,
          question: "___ the complexity of the issue, a simple solution seems unlikely.",
          options: ["Despite", "Given", "Although", "Because"],
          correctAnswer: 1,
          level: 'C2',
          type: 'grammar'
        },
        {
          id: 47,
          question: "What does 'perspicacious' mean?",
          options: ["confused", "having keen insight", "superficial", "obvious"],
          correctAnswer: 1,
          level: 'C2',
          type: 'vocabulary'
        },
        {
          id: 48,
          question: "Were it not for his intervention, the project ___ failed.",
          options: ["would have", "will have", "had", "has"],
          correctAnswer: 0,
          level: 'C2',
          type: 'grammar'
        },
        {
          id: 49,
          question: "Choose the synonym for 'recondite':",
          options: ["simple", "obscure", "obvious", "popular"],
          correctAnswer: 1,
          level: 'C2',
          type: 'vocabulary'
        },
        {
          id: 50,
          question: "The theory ___ considerable controversy among scholars.",
          options: ["has engendered", "have engendered", "engendering", "to engender"],
          correctAnswer: 0,
          level: 'C2',
          type: 'grammar'
        }
      ];
      
      return fallbackQuestions;
    }
  };

  const calculateTestResult = (answers: number[]): TestResult => {
    const levelScores: { [key in CEFRLevel]: number } = {
      'A1': 0, 'A2': 0, 'B1': 0, 'B2': 0, 'C1': 0, 'C2': 0
    };

    let correctAnswers = 0;
    
    answers.forEach((answer, index) => {
      const question = questions[index];
      if (answer === question.correctAnswer) {
        correctAnswers++;
        levelScores[question.level]++;
      }
    });

    const scorePercentage = Math.round((correctAnswers / questions.length) * 100);
    
    // Daha sıkı seviye belirleme algoritması (50 soru için)
    let estimatedLevel: CEFRLevel = 'A1';
    
    // Her seviyedeki soru sayıları: A1(8), A2(8), B1(10), B2(10), C1(8), C2(6)
    // Daha yüksek minimum doğru cevap sayıları ve başarı oranları
    if (levelScores.C2 >= 5 && scorePercentage >= 85 && correctAnswers >= 42) estimatedLevel = 'C2';
    else if (levelScores.C1 >= 6 && scorePercentage >= 80 && correctAnswers >= 38) estimatedLevel = 'C1';
    else if (levelScores.B2 >= 7 && scorePercentage >= 75 && correctAnswers >= 35) estimatedLevel = 'B2';
    else if (levelScores.B1 >= 7 && scorePercentage >= 70 && correctAnswers >= 30) estimatedLevel = 'B1';
    else if (levelScores.A2 >= 6 && scorePercentage >= 65 && correctAnswers >= 25) estimatedLevel = 'A2';
    else if (levelScores.A1 >= 5 && scorePercentage >= 60 && correctAnswers >= 20) estimatedLevel = 'A1';
    else estimatedLevel = 'A1'; // Varsayılan seviye

    return {
      totalQuestions: questions.length,
      correctAnswers,
      scorePercentage,
      estimatedLevel,
      levelScores
    };
  };

  const updateUserLevel = async (newLevel: CEFRLevel) => {
    if (!user) return;
    
    try {
      const storageService = databaseService; // Using database service for all platforms
      await storageService.updateUserLevel(parseInt(user.id), newLevel);
      
      // Test sonucunu kaydet
      const testData = {
        user_id: parseInt(user.id),
        test_type: 'level_assessment' as const,
        cefr_level: newLevel,
        total_questions: testResult!.totalQuestions,
        correct_answers: testResult!.correctAnswers,
        score_percentage: testResult!.scorePercentage,
        duration_seconds: startTime ? Math.floor((new Date().getTime() - startTime.getTime()) / 1000) : 0,
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      
      await storageService.createTest(testData);
      
    } catch (error) {
      console.error('Error updating user level:', error);
      Alert.alert('Hata', 'Seviye güncellenirken bir hata oluştu.');
    }
  };

  useEffect(() => {
    const loadQuestions = async () => {
      if (testType === 'level_test') {
        const testQuestions = await generateLevelTestQuestions();
        setQuestions(testQuestions);
      }
      setIsLoading(false);
    };
    
    loadQuestions();
  }, [testType]);

  const startTest = async () => {
    // Sorular zaten useEffect'te yüklendi, sadece testi başlat
    setTestStarted(true);
    setStartTime(new Date());
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setUserAnswers([]);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    
    // Cevap seçildikten sonra otomatik olarak bir sonraki soruya geç
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        // Mevcut cevabı kaydet
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = answerIndex;
        setUserAnswers(newAnswers);
        
        // Bir sonraki soruya geç
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(userAnswers[currentQuestionIndex + 1] || null);
      } else {
         // Son soru ise testi bitir
         const newAnswers = [...userAnswers];
         newAnswers[currentQuestionIndex] = answerIndex;
         setUserAnswers(newAnswers);
         
         // Test sonucunu hesapla ve bitir
         const result = calculateTestResult(newAnswers);
         setTestResult(result);
         setTestCompleted(true);
         
         // Kullanıcı seviyesini güncelle
         if (testType === 'level_test') {
           updateUserLevel(result.estimatedLevel);
         }
       }
    }, 500); // 500ms bekle, kullanıcı seçimini görebilsin
  };

  // Navigation functions
  const navigateToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      // Save current answer before navigating
      if (selectedAnswer !== null) {
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = selectedAnswer;
        setUserAnswers(newAnswers);
      }
      
      setCurrentQuestionIndex(index);
      setSelectedAnswer(userAnswers[index] || null);
      setSidebarVisible(false);
      setCanNavigateBack(true);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      navigateToQuestion(currentQuestionIndex - 1);
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      navigateToQuestion(currentQuestionIndex + 1);
    }
  };

  const getQuestionStatus = (index: number) => {
    if (userAnswers[index] !== undefined) {
      return 'answered';
    }
    return 'unanswered';
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null) {
      Alert.alert('Uyarı', 'Lütfen bir seçenek seçin.');
      return;
    }

    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = selectedAnswer;
    setUserAnswers(newAnswers);
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(userAnswers[currentQuestionIndex + 1] || null);
    } else {
      // Test tamamlandı
      const result = calculateTestResult([...newAnswers]);
      setTestResult(result);
      setTestCompleted(true);
      
      if (testType === 'level_test') {
        updateUserLevel(result.estimatedLevel);
      }
    }
  };

  const handleFinishTest = async () => {
    if (testResult) {
      // Kullanıcı seviyesini güncelle
      try {
        const currentUser = user;
        if (currentUser) {
          // Redux store'daki kullanıcı seviyesini güncelle
          await dispatch(updateUserLevelAction(testResult.estimatedLevel));
          
          console.log(`Kullanıcı seviyesi ${testResult.estimatedLevel} olarak güncellendi`);
        }
      } catch (error) {
        console.error('Kullanıcı seviyesi güncellenirken hata:', error);
      }
    }
    
    Alert.alert(
      'Tebrikler!',
      `Seviye tespit sınavınız tamamlandı. Tahmini seviyeniz: ${testResult?.estimatedLevel}`,
      [
        {
          text: 'Ana Sayfaya Dön',
          onPress: () => navigation.navigate('Dashboard')
        }
      ]
    );
  };

  const getLevelColor = (level: CEFRLevel): string => {
    switch (level) {
      case 'A1': return '#10b981';
      case 'A2': return '#3b82f6';
      case 'B1': return '#f59e0b';
      case 'B2': return '#ef4444';
      case 'C1': return '#8b5cf6';
      case 'C2': return '#1f2937';
      default: return '#6b7280';
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Test hazırlanıyor...</Text>
      </View>
    );
  }

  // Yükleme ekranı
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Sorular hazırlanıyor...</Text>
      </View>
    );
  }

  // Test başlangıç ekranı
  if (!testStarted && testType === 'level_test') {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Ionicons name="school-outline" size={48} color="#6366f1" />
            <Text style={styles.title}>{getTestTitle()}</Text>
            <Text style={styles.subtitle}>
              İngilizce seviyenizi belirlemek için TOEFL/IELTS standartlarında 50 soruluk kapsamlı bir test hazırladık.
            </Text>
          </View>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Test Hakkında</Text>
            <Text style={styles.infoText}>• Toplam 50 soru (TOEFL/IELTS standartları)</Text>
            <Text style={styles.infoText}>• A1'den C2'ye kadar tüm seviyeler</Text>
            <Text style={styles.infoText}>• Akademik kelime bilgisi ve ileri gramer</Text>
            <Text style={styles.infoText}>• Tahmini süre: 25-35 dakika</Text>
          </View>

          <View style={styles.levelInfo}>
            <Text style={styles.levelTitle}>CEFR Seviyeleri</Text>
            {(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as CEFRLevel[]).map((level) => (
              <View key={level} style={styles.levelItem}>
                <View style={[styles.levelBadge, { backgroundColor: getLevelColor(level) }]}>
                  <Text style={styles.levelBadgeText}>{level}</Text>
                </View>
                <Text style={styles.levelDescription}>
                  {level === 'A1' && 'Başlangıç - Temel kelimeler ve basit cümleler'}
                  {level === 'A2' && 'Temel - Günlük konuşmalar ve basit metinler'}
                  {level === 'B1' && 'Orta - İş ve okul konularında anlayış'}
                  {level === 'B2' && 'Orta-İleri - Karmaşık metinleri anlama'}
                  {level === 'C1' && 'İleri - Akıcı ve etkili dil kullanımı'}
                  {level === 'C2' && 'Uzman - Ana dili seviyesinde yeterlilik'}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.startButton} onPress={startTest}>
            <Text style={styles.startButtonText}>Teste Başla</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Test tamamlandı ekranı
  if (testCompleted && testResult) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Ionicons name="trophy" size={48} color="#f59e0b" />
            <Text style={styles.title}>Test Tamamlandı!</Text>
          </View>

          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Sonuçlarınız</Text>
            
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreText}>{testResult.scorePercentage}%</Text>
              <Text style={styles.scoreLabel}>
                {testResult.correctAnswers}/{testResult.totalQuestions} doğru cevap
              </Text>
            </View>

            <View style={styles.levelResult}>
              <Text style={styles.levelResultLabel}>Tahmini Seviyeniz:</Text>
              <View style={[styles.levelResultBadge, { backgroundColor: getLevelColor(testResult.estimatedLevel) }]}>
                <Text style={styles.levelResultText}>{testResult.estimatedLevel}</Text>
              </View>
            </View>

            <View style={styles.levelBreakdown}>
              <Text style={styles.breakdownTitle}>Seviye Bazında Performans:</Text>
              {Object.entries(testResult.levelScores).map(([level, score]) => (
                <View key={level} style={styles.breakdownItem}>
                  <View style={[styles.breakdownBadge, { backgroundColor: getLevelColor(level as CEFRLevel) }]}>
                    <Text style={styles.breakdownBadgeText}>{level}</Text>
                  </View>
                  <Text style={styles.breakdownScore}>{score}/2 doğru</Text>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.finishButton} onPress={handleFinishTest}>
            <Text style={styles.finishButtonText}>Ana Sayfaya Dön</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Test soruları ekranı
  if (testStarted && !testCompleted) {
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
      <View style={styles.container}>
        {/* Sidebar */}
        {sidebarVisible && (
          <>
            <TouchableOpacity 
              style={styles.sidebarOverlay} 
              onPress={() => setSidebarVisible(false)}
            />
            <View style={styles.sidebar}>
              <View style={styles.sidebarHeader}>
                <Text style={styles.sidebarTitle}>Soru Listesi</Text>
                <Text style={styles.sidebarSubtitle}>{questions.length} soru</Text>
              </View>
              <ScrollView style={styles.sidebarContent}>
                {questions.map((question, index) => {
                  const status = getQuestionStatus(index);
                  const isCurrent = index === currentQuestionIndex;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[styles.questionListItem, isCurrent && styles.currentQuestionItem]}
                      onPress={() => navigateToQuestion(index)}
                    >
                      <View style={[
                        styles.questionItemNumber,
                        isCurrent && styles.currentQuestionNumber,
                        status === 'answered' && styles.answeredQuestionNumber
                      ]}>
                        <Text style={[
                          styles.questionItemNumberText,
                          isCurrent && styles.currentQuestionNumberText,
                          status === 'answered' && styles.answeredQuestionNumberText
                        ]}>
                          {index + 1}
                        </Text>
                      </View>
                      <View style={styles.questionItemContent}>
                        <Text style={styles.questionItemText} numberOfLines={2}>
                          {question.question}
                        </Text>
                        <View style={styles.questionItemMeta}>
                          <View style={[styles.questionItemBadge, { backgroundColor: getLevelColor(question.level) }]}>
                            <Text style={styles.questionItemBadgeText}>{question.level}</Text>
                          </View>
                          <Text style={styles.questionItemStatus}>
                            {status === 'answered' ? 'Cevaplanmış' : 'Cevaplanmamış'}
                          </Text>
                        </View>
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

        <View style={styles.testHeader}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.sidebarButton}
              onPress={() => setSidebarVisible(true)}
            >
              <Ionicons name="list" size={24} color="#6366f1" />
            </TouchableOpacity>
            <Text style={styles.testTitle}>Seviye Tespit Sınavı</Text>
            <View style={styles.headerSpacer} />
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {currentQuestionIndex + 1} / {questions.length}
            </Text>
          </View>
          
          <View style={styles.questionInfo}>
            <View style={[styles.questionLevelBadge, { backgroundColor: getLevelColor(currentQuestion.level) }]}>
              <Text style={styles.questionLevelText}>{currentQuestion.level}</Text>
            </View>
            <Text style={styles.questionType}>
              {currentQuestion.type === 'vocabulary' ? 'Kelime Bilgisi' : 'Gramer'}
            </Text>
          </View>
        </View>

        <ScrollView style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
          
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  selectedAnswer === index && styles.selectedOption
                ]}
                onPress={() => handleAnswerSelect(index)}
              >
                <Text style={[
                  styles.optionText,
                  selectedAnswer === index && styles.selectedOptionText
                ]}>
                  {String.fromCharCode(65 + index)}. {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.bottomContainer}>
          {/* Navigation Buttons */}
          <View style={styles.navigationButtons}>
            <TouchableOpacity
              style={[styles.navButton, currentQuestionIndex === 0 && styles.navButtonDisabled]}
              onPress={goToPreviousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              <Ionicons name="chevron-back" size={20} color={currentQuestionIndex === 0 ? '#9ca3af' : '#6366f1'} />
              <Text style={[styles.navButtonText, currentQuestionIndex === 0 && styles.navButtonDisabledText]}>Önceki</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.navButton, currentQuestionIndex === questions.length - 1 && styles.navButtonDisabled]}
              onPress={goToNextQuestion}
              disabled={currentQuestionIndex === questions.length - 1}
            >
              <Text style={[styles.navButtonText, currentQuestionIndex === questions.length - 1 && styles.navButtonDisabledText]}>Sonraki</Text>
              <Ionicons name="chevron-forward" size={20} color={currentQuestionIndex === questions.length - 1 ? '#9ca3af' : '#6366f1'} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Varsayılan ekran (diğer test türleri için)
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="school-outline" size={48} color="#6366f1" />
          <Text style={styles.title}>{getTestTitle()}</Text>
          <Text style={styles.subtitle}>Test ID: {testId || 'Yeni Test'}</Text>
        </View>
        
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Bu test türü henüz geliştirilmemiştir.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: isMobile ? 16 : 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: isMobile ? 24 : 40,
  },
  title: {
    fontSize: isMobile ? 22 : 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: isMobile ? 12 : 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: isMobile ? 14 : 16,
    color: '#6b7280',
    marginTop: isMobile ? 6 : 8,
    textAlign: 'center',
  },
  placeholder: {
    backgroundColor: '#ffffff',
    padding: isMobile ? 20 : 30,
    borderRadius: isMobile ? 8 : 12,
    alignItems: 'center',
    boxShadow: '0 2px 3.84px rgba(0, 0, 0, 0.1)',
    elevation: 5,
  },
  placeholderText: {
    fontSize: isMobile ? 14 : 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: isMobile ? 20 : 24,
  },
  // Loading styles
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: isMobile ? 12 : 16,
    fontSize: isMobile ? 14 : 16,
    color: '#6b7280',
  },
  // Info card styles
  infoCard: {
    backgroundColor: '#ffffff',
    padding: isMobile ? 16 : 20,
    borderRadius: isMobile ? 8 : 12,
    marginBottom: isMobile ? 16 : 24,
    boxShadow: '0 2px 3.84px rgba(0, 0, 0, 0.1)',
    elevation: 5,
  },
  infoTitle: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: isMobile ? 8 : 12,
  },
  infoText: {
    fontSize: isMobile ? 12 : 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  // Level info styles
  levelInfo: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  levelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12,
    minWidth: 40,
    alignItems: 'center',
  },
  levelBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  levelDescription: {
    flex: 1,
    fontSize: 12,
    color: '#6b7280',
  },
  // Button styles
  startButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  // Result styles
  resultCard: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#10b981',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  levelResult: {
    alignItems: 'center',
    marginBottom: 24,
  },
  levelResultLabel: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  levelResultBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  levelResultText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  levelBreakdown: {
    marginTop: 8,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  breakdownBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 40,
    alignItems: 'center',
  },
  breakdownBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  breakdownScore: {
    fontSize: 14,
    color: '#6b7280',
  },
  finishButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  finishButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Test header styles
  testHeader: {
    backgroundColor: '#ffffff',
    padding: isMobile ? 16 : 20,
    paddingTop: isMobile ? 50 : 20, // Safe area for mobile
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  progressContainer: {
    marginBottom: isMobile ? 12 : 16,
  },
  progressBar: {
    height: isMobile ? 6 : 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: isMobile ? 6 : 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  progressText: {
    fontSize: isMobile ? 12 : 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  questionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  questionLevelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  questionLevelText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  questionType: {
    fontSize: 14,
    color: '#6b7280',
  },
  // Question styles
  questionContainer: {
    flex: 1,
    padding: isMobile ? 16 : 20,
  },
  questionText: {
    fontSize: isMobile ? 16 : 18,
    color: '#1f2937',
    marginBottom: isMobile ? 16 : 24,
    lineHeight: isMobile ? 22 : 26,
  },
  optionsContainer: {
    gap: isMobile ? 8 : 12,
  },
  optionButton: {
    backgroundColor: '#ffffff',
    padding: isMobile ? 12 : 16,
    borderRadius: isMobile ? 8 : 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  selectedOption: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f9ff',
  },
  optionText: {
    fontSize: isMobile ? 14 : 16,
    color: '#1f2937',
  },
  selectedOptionText: {
    color: '#6366f1',
    fontWeight: '500',
  },
  // Bottom container styles
  bottomContainer: {
    padding: isMobile ? 16 : 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  nextButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: isMobile ? 12 : 16,
    borderRadius: isMobile ? 8 : 12,
  },
  disabledButton: {
    backgroundColor: '#e5e7eb',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: isMobile ? 14 : 16,
    fontWeight: 'bold',
    marginRight: isMobile ? 6 : 8,
  },
  disabledButtonText: {
    color: '#9ca3af',
  },
  // Navigation buttons styles
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: isMobile ? 12 : 16,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isMobile ? 16 : 24,
    paddingVertical: isMobile ? 12 : 16,
    borderRadius: isMobile ? 8 : 12,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: isMobile ? 100 : 120,
    justifyContent: 'center',
  },
  navButtonDisabled: {
    backgroundColor: '#f9fafb',
    borderColor: '#f3f4f6',
  },
  navButtonText: {
    fontSize: isMobile ? 14 : 16,
    fontWeight: '600',
    color: '#6366f1',
    marginHorizontal: 4,
  },
  navButtonDisabledText: {
    color: '#9ca3af',
  },
  // Sidebar styles
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: isMobile ? '90%' : '80%',
    height: '100%',
    backgroundColor: '#ffffff',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
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
    marginBottom: 4,
  },
  sidebarSubtitle: {
    fontSize: isMobile ? 12 : 14,
    color: '#6b7280',
  },
  sidebarContent: {
    flex: 1,
    padding: isMobile ? 12 : 16,
  },
  questionListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: isMobile ? 8 : 12,
    marginBottom: isMobile ? 6 : 8,
    backgroundColor: '#f9fafb',
    borderRadius: isMobile ? 6 : 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  currentQuestionItem: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  questionItemNumber: {
    width: isMobile ? 28 : 32,
    height: isMobile ? 28 : 32,
    borderRadius: isMobile ? 14 : 16,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: isMobile ? 8 : 12,
  },
  currentQuestionNumber: {
    backgroundColor: '#3b82f6',
  },
  answeredQuestionNumber: {
    backgroundColor: '#10b981',
  },
  questionItemNumberText: {
    fontSize: isMobile ? 12 : 14,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  currentQuestionNumberText: {
    color: '#ffffff',
  },
  answeredQuestionNumberText: {
    color: '#ffffff',
  },
  questionItemContent: {
    flex: 1,
  },
  questionItemText: {
    fontSize: isMobile ? 12 : 14,
    color: '#1f2937',
    marginBottom: 4,
  },
  questionItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  questionItemBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  questionItemBadgeText: {
    fontSize: isMobile ? 10 : 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  questionItemStatus: {
    fontSize: isMobile ? 10 : 12,
    color: '#6b7280',
  },
  sidebarFooter: {
    padding: isMobile ? 16 : 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  sidebarCloseButton: {
    backgroundColor: '#6366f1',
    paddingVertical: isMobile ? 10 : 12,
    paddingHorizontal: isMobile ? 20 : 24,
    borderRadius: isMobile ? 6 : 8,
    alignItems: 'center',
  },
  sidebarCloseButtonText: {
    color: '#ffffff',
    fontSize: isMobile ? 14 : 16,
    fontWeight: '600',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: isMobile ? 12 : 16,
  },
  sidebarButton: {
    padding: isMobile ? 6 : 8,
    borderRadius: isMobile ? 6 : 8,
    backgroundColor: '#f3f4f6',
  },
  testTitle: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSpacer: {
    width: 40,
  },
});

export default TestScreen;