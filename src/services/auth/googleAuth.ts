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
    // E-posta ile ilgili hatalar
    case 'auth/email-already-in-use':
      return 'Bu e-posta adresi zaten kullanılıyor. Farklı bir e-posta deneyin veya giriş yapın';
    case 'auth/invalid-email':
      return 'Geçersiz e-posta adresi formatı. Lütfen doğru bir e-posta adresi girin';
    case 'auth/user-not-found':
      return 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı. Kayıt olmayı deneyin';
    
    // Şifre ile ilgili hatalar
    case 'auth/weak-password':
      return 'Şifre çok zayıf. En az 6 karakter, bir harf ve bir rakam içermelidir';
    case 'auth/wrong-password':
      return 'Hatalı şifre. Lütfen şifrenizi kontrol edin veya şifre sıfırlama yapın';
    
    // Güvenlik ve erişim hataları
    case 'auth/too-many-requests':
      return 'Çok fazla başarısız deneme yapıldı. Lütfen bir süre bekleyip tekrar deneyin';
    case 'auth/user-disabled':
      return 'Bu hesap devre dışı bırakılmış. Destek ekibi ile iletişime geçin';
    case 'auth/operation-not-allowed':
      return 'Bu işlem şu anda izin verilmiyor. Lütfen daha sonra tekrar deneyin';
    
    // Ağ ve bağlantı hataları
    case 'auth/network-request-failed':
      return 'İnternet bağlantısı sorunu. Lütfen bağlantınızı kontrol edin';
    case 'auth/timeout':
      return 'İşlem zaman aşımına uğradı. Lütfen tekrar deneyin';
    
    // Google Auth hataları
    case 'auth/popup-closed-by-user':
      return 'Google giriş penceresi kapatıldı. Lütfen tekrar deneyin';
    case 'auth/popup-blocked':
      return 'Popup engellenmiş. Lütfen tarayıcı ayarlarınızı kontrol edin';
    case 'auth/cancelled-popup-request':
      return 'Google giriş işlemi iptal edildi';
    
    // Genel hatalar
    case 'auth/internal-error':
      return 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin';
    case 'auth/invalid-credential':
      return 'Geçersiz kimlik bilgileri. Lütfen bilgilerinizi kontrol edin';
    case 'auth/credential-already-in-use':
      return 'Bu kimlik bilgileri başka bir hesap tarafından kullanılıyor';
    
    // Varsayılan hata
    default:
      return 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin veya destek ekibi ile iletişime geçin';
  }
};