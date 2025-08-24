import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  navigation: any;
}

interface Question {
  id: number;
  word: string;
  correctAnswer: string;
  options: string[];
  type: 'definition' | 'translation';
}

interface TestResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
}

const TestScreen: React.FC<Props> = ({ navigation }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [testStarted, setTestStarted] = useState(false);

  useEffect(() => {
    generateQuestions();
  }, []);

  const generateQuestions = () => {
    try {
      // API kullanıldığı için boş questions array'i
      const generatedQuestions: Question[] = [];

      setQuestions(generatedQuestions);
    } catch (error) {
      console.error('Error generating questions:', error);
      Alert.alert('Hata', 'Sorular oluşturulurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleNextQuestion = () => {
    if (!selectedAnswer) {
      Alert.alert('Uyarı', 'Lütfen bir seçenek seçin.');
      return;
    }

    const newAnswers = [...userAnswers, selectedAnswer];
    setUserAnswers(newAnswers);
    setSelectedAnswer(null);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Test completed
      calculateResult(newAnswers);
    }
  };

  const calculateResult = (answers: string[]) => {
    let correctCount = 0;
    
    answers.forEach((answer, index) => {
      if (answer === questions[index].correctAnswer) {
        correctCount++;
      }
    });

    const result: TestResult = {
      score: Math.round((correctCount / questions.length) * 100),
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      wrongAnswers: questions.length - correctCount,
    };

    setTestResult(result);
    setShowResult(true);
  };

  const restartTest = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setUserAnswers([]);
    setShowResult(false);
    setTestResult(null);
    setTestStarted(false);
    generateQuestions();
  };

  const startTest = () => {
    setTestStarted(true);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Test hazırlanıyor...</Text>
      </View>
    );
  }

  if (!testStarted) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.welcomeCard}>
            <Ionicons name="school-outline" size={64} color="#6366f1" />
            <Text style={styles.welcomeTitle}>Kelime Testi</Text>
            <Text style={styles.welcomeDescription}>
              10 soruluk kelime testine hoş geldiniz! Bu test, kelime bilginizi ölçmek için tasarlanmıştır.
            </Text>
            
            <View style={styles.testInfo}>
              <View style={styles.infoItem}>
                <Ionicons name="help-circle-outline" size={24} color="#6366f1" />
                <Text style={styles.infoText}>10 Soru</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="time-outline" size={24} color="#6366f1" />
                <Text style={styles.infoText}>Süre Sınırı Yok</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="trophy-outline" size={24} color="#6366f1" />
                <Text style={styles.infoText}>Puan Sistemi</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.startButton} onPress={startTest}>
              <Text style={styles.startButtonText}>Teste Başla</Text>
              <Ionicons name="arrow-forward" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (showResult && testResult) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.resultCard}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreText}>{testResult.score}%</Text>
            </View>
            
            <Text style={styles.resultTitle}>Test Tamamlandı!</Text>
            
            <View style={styles.resultStats}>
              <View style={styles.statItem}>
                <Ionicons name="checkmark-circle" size={32} color="#10b981" />
                <Text style={styles.statNumber}>{testResult.correctAnswers}</Text>
                <Text style={styles.statLabel}>Doğru</Text>
              </View>
              
              <View style={styles.statItem}>
                <Ionicons name="close-circle" size={32} color="#ef4444" />
                <Text style={styles.statNumber}>{testResult.wrongAnswers}</Text>
                <Text style={styles.statLabel}>Yanlış</Text>
              </View>
              
              <View style={styles.statItem}>
                <Ionicons name="help-circle" size={32} color="#6366f1" />
                <Text style={styles.statNumber}>{testResult.totalQuestions}</Text>
                <Text style={styles.statLabel}>Toplam</Text>
              </View>
            </View>

            <View style={styles.resultActions}>
              <TouchableOpacity style={styles.restartButton} onPress={restartTest}>
                <Ionicons name="refresh" size={20} color="#6366f1" />
                <Text style={styles.restartButtonText}>Tekrar Dene</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.homeButton} 
                onPress={() => navigation.navigate('Dashboard')}
              >
                <Ionicons name="home" size={20} color="#ffffff" />
                <Text style={styles.homeButtonText}>Ana Sayfa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {currentQuestionIndex + 1} / {questions.length}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.questionCard}>
          <Text style={styles.questionType}>
            {currentQuestion.type === 'definition' ? 'Türkçe Karşılığı' : 'İngilizce Tanımı'}
          </Text>
          
          <Text style={styles.questionWord}>{currentQuestion.word}</Text>
          
          <Text style={styles.questionPrompt}>
            {currentQuestion.type === 'definition' 
              ? 'Bu kelimenin Türkçe karşılığı nedir?' 
              : 'Bu kelimenin İngilizce tanımı nedir?'
            }
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                selectedAnswer === option && styles.selectedOption,
              ]}
              onPress={() => handleAnswerSelect(option)}
            >
              <Text style={[
                styles.optionText,
                selectedAnswer === option && styles.selectedOptionText,
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={[
            styles.nextButton,
            !selectedAnswer && styles.disabledButton,
          ]} 
          onPress={handleNextQuestion}
          disabled={!selectedAnswer}
        >
          <Text style={[
            styles.nextButtonText,
            !selectedAnswer && styles.disabledButtonText,
          ]}>
            {currentQuestionIndex === questions.length - 1 ? 'Testi Bitir' : 'Sonraki Soru'}
          </Text>
          <Ionicons 
            name={currentQuestionIndex === questions.length - 1 ? 'checkmark' : 'arrow-forward'} 
            size={20} 
            color={selectedAnswer ? '#ffffff' : '#9ca3af'} 
          />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  content: {
    padding: 20,
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  welcomeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 12,
  },
  welcomeDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  testInfo: {
    width: '100%',
    marginBottom: 32,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 16,
    color: '#4b5563',
    marginLeft: 12,
  },
  startButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  questionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  questionType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  questionWord: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  questionPrompt: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  optionsContainer: {
    marginBottom: 32,
  },
  optionButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  selectedOption: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f9ff',
  },
  optionText: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
  },
  selectedOptionText: {
    color: '#6366f1',
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  disabledButton: {
    backgroundColor: '#e5e7eb',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  disabledButtonText: {
    color: '#9ca3af',
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 32,
  },
  resultStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 32,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  restartButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  homeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default TestScreen;