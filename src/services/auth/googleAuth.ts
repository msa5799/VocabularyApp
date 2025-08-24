import { 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User 
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { Platform } from 'react-native';

// Google Auth için tip tanımları
export interface GoogleAuthResult {
  user: User | null;
  error?: string;
}

// Web için Google Sign In
export const signInWithGoogle = async (): Promise<GoogleAuthResult> => {
  try {
    if (Platform.OS === 'web') {
      // Web platformu için popup kullan
      const result = await signInWithPopup(auth, googleProvider);
      return { user: result.user };
    } else {
      // Mobile platformlar için redirect kullan (şimdilik web odaklı)
      await signInWithRedirect(auth, googleProvider);
      const result = await getRedirectResult(auth);
      return { user: result?.user || null };
    }
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    return { 
      user: null, 
      error: error.message || 'Google ile giriş yapılırken bir hata oluştu' 
    };
  }
};

// Çıkış yapma
export const signOutGoogle = async (): Promise<void> => {
  try {
    await auth.signOut();
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

// Mevcut kullanıcıyı alma
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Auth state değişikliklerini dinleme
export const onAuthStateChanged = (callback: (user: User | null) => void) => {
  return auth.onAuthStateChanged(callback);
};

// Email/Password ile kayıt olma
export const signUpWithEmailPassword = async (email: string, password: string): Promise<GoogleAuthResult> => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return { user: result.user };
  } catch (error: any) {
    console.error('Email/Password Sign Up Error:', error);
    return { 
      user: null, 
      error: error.message || 'Email ile kayıt olurken bir hata oluştu' 
    };
  }
};

// Email/Password ile giriş yapma
export const signInWithEmailPassword = async (email: string, password: string): Promise<GoogleAuthResult> => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { user: result.user };
  } catch (error: any) {
    console.error('Email/Password Sign In Error:', error);
    return { 
      user: null, 
      error: error.message || 'Email ile giriş yapılırken bir hata oluştu' 
    };
  }
};

// Firebase Auth hatalarını Türkçe'ye çevirme
export const getFirebaseErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'Bu e-posta adresi zaten kullanılıyor';
    case 'auth/weak-password':
      return 'Şifre çok zayıf';
    case 'auth/invalid-email':
      return 'Geçersiz e-posta adresi';
    case 'auth/user-not-found':
      return 'Kullanıcı bulunamadı';
    case 'auth/wrong-password':
      return 'Hatalı şifre';
    case 'auth/too-many-requests':
      return 'Çok fazla deneme yapıldı, lütfen daha sonra tekrar deneyin';
    default:
      return 'Bir hata oluştu';
  }
};