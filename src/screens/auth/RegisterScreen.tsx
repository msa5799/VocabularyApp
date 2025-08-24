import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { registerUser, loginWithGoogle, registerWithFirebase } from '../../store/slices/authSlice';
import { Ionicons } from '@expo/vector-icons';
import { validateEmail, validatePassword } from '../../utils/helpers/auth';

interface Props {
  navigation: any;
}

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { username, email, password, confirmPassword } = formData;
    
    // Clear previous errors
    setValidationError(null);

    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      setValidationError('Lütfen tüm alanları doldurun');
      return false;
    }

    if (username.trim().length < 3) {
      setValidationError('Kullanıcı adı en az 3 karakter olmalıdır');
      return false;
    }

    if (!validateEmail(email)) {
      setValidationError('Geçerli bir e-posta adresi girin');
      return false;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setValidationError(passwordValidation.message);
      return false;
    }

    if (password !== confirmPassword) {
      setValidationError('Şifreler eşleşmiyor');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    // Clear previous messages
    setValidationError(null);
    setSuccessMessage(null);

    try {
      // Firebase Authentication ile kayıt ol
      await dispatch(registerWithFirebase({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
      })).unwrap();
      
      setSuccessMessage('Hesabınız oluşturuldu! Giriş yapabilirsiniz.');
      // Navigate after a short delay to show success message
      setTimeout(() => {
        navigation.navigate('Login');
      }, 2000);
    } catch (error) {
      // Error will be handled by Redux state and displayed in UI
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  const handleGoogleLogin = async () => {
    try {
      await dispatch(loginWithGoogle()).unwrap();
    } catch (error) {
      Alert.alert('Google Giriş Hatası', error as string);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Hesap Oluştur</Text>
          <Text style={styles.subtitle}>Yeni hesabınızı oluşturun</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#6b7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Kullanıcı Adı"
              value={formData.username}
              onChangeText={(value) => handleInputChange('username', value)}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#6b7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="E-posta"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Şifre"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons 
                name={showPassword ? 'eye-outline' : 'eye-off-outline'} 
                size={20} 
                color="#6b7280" 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Şifre Tekrar"
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons 
                name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} 
                size={20} 
                color="#6b7280" 
              />
            </TouchableOpacity>
          </View>

          {Platform.OS === 'web' ? (
            <button
              style={{
                backgroundColor: isLoading ? '#9ca3af' : '#6366f1',
                borderRadius: '12px',
                paddingTop: '16px',
                paddingBottom: '16px',
                paddingLeft: '16px',
                paddingRight: '16px',
                alignItems: 'center',
                marginTop: '8px',
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                outline: 'none',
                width: '100%',
                color: '#fff',
                fontSize: '16px',
                fontWeight: '600'
              }}
              onClick={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? 'Hesap oluşturuluyor...' : 'Hesap Oluştur'}
            </button>
          ) : (
            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.disabledButton]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.registerButtonText}>
                {isLoading ? 'Hesap oluşturuluyor...' : 'Hesap Oluştur'}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>veya</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.googleButton, isLoading && styles.disabledButton]}
            onPress={handleGoogleLogin}
            disabled={isLoading}
          >
            <Ionicons name="logo-google" size={20} color="#4285f4" style={styles.googleIcon} />
            <Text style={styles.googleButtonText}>
              Google ile Kayıt Ol
            </Text>
          </TouchableOpacity>

          {/* Validation Error Message */}
          {validationError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{validationError}</Text>
            </View>
          )}

          {/* Redux Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Success Message */}
          {successMessage && (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Zaten hesabınız var mı? </Text>
          <TouchableOpacity onPress={navigateToLogin}>
            <Text style={styles.linkText}>Giriş Yap</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  form: {
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
    color: '#1f2937',
  },
  eyeIcon: {
    padding: 4,
  },
  registerButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  successContainer: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  successText: {
    color: '#16a34a',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
  },
  linkText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#6b7280',
  },
  googleButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  googleIcon: {
    marginRight: 12,
  },
  googleButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RegisterScreen;