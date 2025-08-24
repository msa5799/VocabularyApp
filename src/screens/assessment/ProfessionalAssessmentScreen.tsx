import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  Animated,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { updateUserLevel } from '../../store/slices/authSlice';
import vocabularyAssessmentService, {
  AssessmentQuestion,
  AssessmentResult,
  AssessmentConfig
} from '../../services/assessment/vocabularyAssessment';
import { CEFRLevel } from '../../types/database';

const { width, height } = Dimensions.get('window');

interface AssessmentScreenProps {
  navigation: any;
  route: {
    params?: {
      assessmentType?: 'full' | 'quick' | 'adaptive';
      targetLevel?: CEFRLevel;
    };
  };
}

const ProfessionalAssessmentScreen: React.FC<AssessmentScreenProps> = ({ navigation, route }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timings, setTimings] = useState<number[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const [isAssessing, setIsAssessing] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60); // 60 seconds per question
  const [isPaused, setIsPaused] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const assessmentType = route.params?.assessmentType || 'full';

  useEffect(() => {
    initializeAssessment();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (questions.length > 0 && !isPaused) {
      startQuestionTimer();
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentQuestionIndex, isPaused]);

  useEffect(() => {
    if (questions.length > 0) {
      const progress = (currentQuestionIndex / questions.length);
      Animated.timing(progressAnimation, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [currentQuestionIndex, questions.length]);

  const initializeAssessment = async () => {
    try {
      setIsLoading(true);
      
      const config: Partial<AssessmentConfig> = {
        totalQuestions: assessmentType === 'quick' ? 20 : assessmentType === 'full' ? 50 : 30,
        adaptiveMode: assessmentType === 'adaptive',
        timeLimit: 60
      };

      if (assessmentType === 'quick') {
        config.questionsPerLevel = {
          'A1': 3,
          'A2': 3,
          'B1': 4,
          'B2': 4,
          'C1': 3,
          'C2': 3
        };
      }

      const generatedQuestions = await vocabularyAssessmentService.generateAssessment(config);
      setQuestions(generatedQuestions);
      setAnswers(new Array(generatedQuestions.length).fill(-1));
      setTimings(new Array(generatedQuestions.length).fill(0));
      setQuestionStartTime(Date.now());
    } catch (error) {
      console.error('Error initializing assessment:', error);
      Alert.alert('Error', 'Failed to load assessment. Please try again.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const startQuestionTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setTimeRemaining(60);
    setQuestionStartTime(Date.now());
    
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeUp = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Auto-submit with no answer (-1)
    const timeSpent = Date.now() - questionStartTime;
    const newTimings = [...timings];
    newTimings[currentQuestionIndex] = timeSpent;
    setTimings(newTimings);
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      finishAssessment();
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    const timeSpent = Date.now() - questionStartTime;
    const newAnswers = [...answers];
    const newTimings = [...timings];
    
    newAnswers[currentQuestionIndex] = answerIndex;
    newTimings[currentQuestionIndex] = timeSpent;
    
    setAnswers(newAnswers);
    setTimings(newTimings);
    
    // Move to next question after a brief delay
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        finishAssessment();
      }
    }, 500);
  };

  const finishAssessment = async () => {
    try {
      setIsAssessing(true);
      
      const result = vocabularyAssessmentService.evaluateAssessment(questions, answers, timings);
      setAssessmentResult(result);
      
      // Update user level if it's higher than current
      if (user && result.estimatedLevel) {
        const levelOrder: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        const currentLevelIndex = levelOrder.indexOf(user.current_level as CEFRLevel);
        const newLevelIndex = levelOrder.indexOf(result.estimatedLevel);
        
        if (newLevelIndex > currentLevelIndex) {
          await dispatch(updateUserLevel(result.estimatedLevel));
        }
      }
      
      setShowResults(true);
    } catch (error) {
      console.error('Error finishing assessment:', error);
      Alert.alert('Error', 'Failed to process assessment results.');
    } finally {
      setIsAssessing(false);
    }
  };

  const handlePause = () => {
    setIsPaused(true);
    setShowPauseModal(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleResume = () => {
    setIsPaused(false);
    setShowPauseModal(false);
    setQuestionStartTime(Date.now()); // Reset timer for current question
  };

  const handleExit = () => {
    Alert.alert(
      'Exit Assessment',
      'Are you sure you want to exit? Your progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: () => navigation.goBack() }
      ]
    );
  };

  const getLevelColor = (level: CEFRLevel): string => {
    const colors = {
      'A1': '#4CAF50',
      'A2': '#8BC34A',
      'B1': '#FFC107',
      'B2': '#FF9800',
      'C1': '#FF5722',
      'C2': '#9C27B0'
    };
    return colors[level];
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Preparing your assessment...</Text>
          <Text style={styles.loadingSubtext}>This may take a few moments</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showResults && assessmentResult) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
            <Ionicons name="trophy" size={60} color="#FFD700" />
            <Text style={styles.resultsTitle}>Assessment Complete!</Text>
            <Text style={styles.scoreText}>{assessmentResult.scorePercentage}%</Text>
          </View>

          <View style={styles.levelCard}>
            <Text style={styles.levelLabel}>Your Estimated Level</Text>
            <View style={[styles.levelBadge, { backgroundColor: getLevelColor(assessmentResult.estimatedLevel) }]}>
              <Text style={styles.levelText}>{assessmentResult.estimatedLevel}</Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{assessmentResult.correctAnswers}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{assessmentResult.totalQuestions}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{Math.round(assessmentResult.questionResults.reduce((sum, q) => sum + q.timeSpent, 0) / 1000 / 60)}</Text>
              <Text style={styles.statLabel}>Minutes</Text>
            </View>
          </View>

          <View style={styles.analysisContainer}>
            <Text style={styles.analysisTitle}>Detailed Analysis</Text>
            
            {assessmentResult.detailedAnalysis.strengths.length > 0 && (
              <View style={styles.analysisSection}>
                <Text style={styles.analysisSectionTitle}>✅ Strengths</Text>
                {assessmentResult.detailedAnalysis.strengths.map((strength, index) => (
                  <Text key={index} style={styles.analysisItem}>• {strength}</Text>
                ))}
              </View>
            )}

            {assessmentResult.detailedAnalysis.weaknesses.length > 0 && (
              <View style={styles.analysisSection}>
                <Text style={styles.analysisSectionTitle}>⚠️ Areas for Improvement</Text>
                {assessmentResult.detailedAnalysis.weaknesses.map((weakness, index) => (
                  <Text key={index} style={styles.analysisItem}>• {weakness}</Text>
                ))}
              </View>
            )}

            {assessmentResult.detailedAnalysis.recommendations.length > 0 && (
              <View style={styles.analysisSection}>
                <Text style={styles.analysisSectionTitle}>💡 Recommendations</Text>
                {assessmentResult.detailedAnalysis.recommendations.map((rec, index) => (
                  <Text key={index} style={styles.analysisItem}>• {rec}</Text>
                ))}
              </View>
            )}
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => navigation.navigate('Dashboard')}
            >
              <Text style={styles.primaryButtonText}>Continue Learning</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => {
                setShowResults(false);
                setCurrentQuestionIndex(0);
                setAnswers(new Array(questions.length).fill(-1));
                setTimings(new Array(questions.length).fill(0));
                initializeAssessment();
              }}
            >
              <Text style={styles.secondaryButtonText}>Retake Assessment</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>No questions available</Text>
          <TouchableOpacity style={styles.retryButton} onPress={initializeAssessment}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleExit} style={styles.exitButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
        
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {currentQuestionIndex + 1} / {questions.length}
          </Text>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        </View>
        
        <TouchableOpacity onPress={handlePause} style={styles.pauseButton}>
          <Ionicons name="pause" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Timer */}
      <View style={styles.timerContainer}>
        <View style={[styles.timerCircle, { borderColor: timeRemaining <= 10 ? '#FF3B30' : '#007AFF' }]}>
          <Text style={[styles.timerText, { color: timeRemaining <= 10 ? '#FF3B30' : '#007AFF' }]}>
            {formatTime(timeRemaining)}
          </Text>
        </View>
      </View>

      {/* Question */}
      <ScrollView style={styles.questionContainer}>
        <View style={styles.questionHeader}>
          <View style={[styles.levelBadge, { backgroundColor: getLevelColor(currentQuestion.level) }]}>
            <Text style={styles.levelText}>{currentQuestion.level}</Text>
          </View>
          <Text style={styles.questionType}>{currentQuestion.type.toUpperCase()}</Text>
        </View>
        
        <Text style={styles.questionText}>{currentQuestion.question}</Text>
        
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => {
            const isSelected = answers[currentQuestionIndex] === index;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  isSelected && styles.selectedOption
                ]}
                onPress={() => handleAnswerSelect(index)}
                disabled={isPaused}
              >
                <View style={styles.optionContent}>
                  <View style={[styles.optionNumber, isSelected && styles.selectedOptionNumber]}>
                    <Text style={[styles.optionNumberText, isSelected && styles.selectedOptionNumberText]}>
                      {String.fromCharCode(65 + index)}
                    </Text>
                  </View>
                  <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
                    {option}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Pause Modal */}
      <Modal
        visible={showPauseModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPauseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pauseModal}>
            <Ionicons name="pause-circle" size={60} color="#007AFF" />
            <Text style={styles.pauseTitle}>Assessment Paused</Text>
            <Text style={styles.pauseText}>Take your time. Resume when you're ready.</Text>
            
            <View style={styles.pauseButtons}>
              <TouchableOpacity style={styles.resumeButton} onPress={handleResume}>
                <Text style={styles.resumeButtonText}>Resume</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.exitPauseButton} onPress={handleExit}>
                <Text style={styles.exitPauseButtonText}>Exit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Loading overlay for assessment processing */}
      {isAssessing && (
        <View style={styles.assessingOverlay}>
          <View style={styles.assessingModal}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.assessingText}>Analyzing your performance...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  exitButton: {
    padding: 8,
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: 20,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  pauseButton: {
    padding: 8,
  },
  timerContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFF',
  },
  timerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 18,
    fontWeight: '700',
  },
  questionContainer: {
    flex: 1,
    padding: 20,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 12,
  },
  levelText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  questionType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 1,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    lineHeight: 28,
    marginBottom: 30,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  selectedOption: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  selectedOptionNumber: {
    backgroundColor: '#007AFF',
  },
  optionNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
  },
  selectedOptionNumberText: {
    color: '#FFF',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  selectedOptionText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseModal: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 40,
    maxWidth: 320,
  },
  pauseTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  pauseText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  pauseButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  resumeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  resumeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  exitPauseButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exitPauseButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  assessingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assessingModal: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 40,
  },
  assessingText: {
    fontSize: 16,
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  resultsContainer: {
    flex: 1,
    padding: 20,
  },
  resultsHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#007AFF',
  },
  levelCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  levelLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  analysisContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  analysisSection: {
    marginBottom: 16,
  },
  analysisSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  analysisItem: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  actionButtons: {
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfessionalAssessmentScreen;