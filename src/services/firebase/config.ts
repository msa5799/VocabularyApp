import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase konfigürasyonu
const firebaseConfig = {
  apiKey: "AIzaSyB4rvpeLwvSTYWk1kk_jPhY1MJJG8ePZkw",
  authDomain: "idea-1ca75.firebaseapp.com",
  projectId: "idea-1ca75",
  storageBucket: "idea-1ca75.firebasestorage.app",
  messagingSenderId: "259200248319",
  appId: "1:259200248319:web:aaebb140eff4c780f85fca",
  measurementId: "G-TWXEV9WPX0"
};

// Firebase uygulamasını başlat - zaten başlatılmışsa mevcut olanı kullan
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Firebase servislerini dışa aktar
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Google Cloud OAuth kimlik bilgilerini kullan
googleProvider.setCustomParameters({
  prompt: 'select_account',
  // Google Cloud Console'dan alınan Web Client ID
  client_id: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
});

// Ek scopes ekle (isteğe bağlı)
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Default export
export default app;