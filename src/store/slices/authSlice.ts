import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types/database';
import { databaseService } from '../../services/storage/database';
// webStorageService removed - using Firestore only
import { firestoreService } from '../../services/storage/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { hashPassword, verifyPassword } from '../../utils/helpers/auth';
import { Platform } from 'react-native';
import { 
  signInWithGoogle, 
  signOutGoogle, 
  onAuthStateChanged,
  signUpWithEmailPassword,
  signInWithEmailPassword,
  getFirebaseErrorMessage
} from '../../services/auth/googleAuth';
import { User as FirebaseUser } from 'firebase/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  username: string;
  password: string;
}

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const storageService = databaseService; // Using database service for all platforms
      const user = await storageService.getUserByEmail(credentials.email);
      
      if (!user) {
        return rejectWithValue('Kullanıcı bulunamadı');
      }

      const isPasswordValid = await verifyPassword(credentials.password, user.password_hash);
      
      if (!isPasswordValid) {
        return rejectWithValue('Şifre hatalı');
      }

      // Store user in AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Giriş yapılırken bir hata oluştu');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData: RegisterData, { rejectWithValue }) => {
    try {
      const storageService = databaseService; // Using database service for all platforms
      
      // Check if user already exists
      const existingUser = await storageService.getUserByEmail(userData.email);
      if (existingUser) {
        return rejectWithValue('Bu e-posta adresi zaten kullanılıyor');
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);
      
      // Create user object
      const newUser: Omit<User, 'id'> = {
        email: userData.email,
        username: userData.username,
        password_hash: hashedPassword,
        current_level: 'A1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Create user in database
      const createdUser = await storageService.createUser(newUser as User);
      
      // Store user in AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(createdUser));
      
      return createdUser;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Kayıt olurken bir hata oluştu');
    }
  }
);

export const checkAuthStatus = createAsyncThunk(
  'auth/checkAuthStatus',
  async (_, { rejectWithValue }) => {
    try {
      const userString = await AsyncStorage.getItem('user');
      if (userString) {
        const user = JSON.parse(userString) as User;
        
        // If user doesn't have firebase_uid, try to find and update it or create in Firestore
        if (!user.firebase_uid && user.email) {
          try {
            let firestoreUser = await firestoreService.getUserByEmail(user.email);
            
            // If user doesn't exist in Firestore, create them
            if (!firestoreUser) {
              console.log('Creating user in Firestore for migration:', user.email);
              firestoreUser = await firestoreService.createUser({
                email: user.email,
                username: user.username,
                password_hash: user.password_hash || '',
                current_level: user.current_level,
                created_at: user.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString(),
                firebase_uid: `migrated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
              });
            }
            
            if (firestoreUser && firestoreUser.firebase_uid) {
              user.firebase_uid = firestoreUser.firebase_uid;
              user.id = firestoreUser.id;
              await AsyncStorage.setItem('user', JSON.stringify(user));
              console.log('Updated user with firebase_uid:', user.firebase_uid);
            }
          } catch (error) {
            console.log('Could not update firebase_uid for existing user:', error);
          }
        }
        
        return user;
      }
      return null;
    } catch (error: any) {
      return rejectWithValue('Oturum kontrolü yapılırken hata oluştu');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async () => {
    await AsyncStorage.removeItem('user');
    // Firebase'den de çıkış yap
    try {
      await signOutGoogle();
    } catch (error) {
      console.log('Firebase sign out error:', error);
    }
  }
);

// Google ile giriş yap
export const loginWithGoogle = createAsyncThunk(
  'auth/loginWithGoogle',
  async (_, { rejectWithValue }) => {
    try {
      const result = await signInWithGoogle();
      
      if (result.error) {
        return rejectWithValue(result.error);
      }
      
      if (!result.user) {
        return rejectWithValue('Google ile giriş yapılamadı');
      }
      
      // Firebase kullanıcısını Firestore'dan al
      const firebaseUser = result.user;
      let user = await firestoreService.getUserByFirebaseUid(firebaseUser.uid);
      
      if (!user) {
        // Kullanıcı Firestore'da yoksa oluştur
        const userData = {
          username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email || '',
          password_hash: '', // Google auth için gerekli değil
          current_level: 'A1',
          firebase_uid: firebaseUser.uid,
          profile_picture: firebaseUser.photoURL || undefined,
          google_id: firebaseUser.uid,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        user = await firestoreService.createUser(userData);
      }
      
      console.log('User logged in with Google, firebase_uid:', user.firebase_uid);
      
      // AsyncStorage'a kaydet
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Google ile giriş yapılırken bir hata oluştu');
    }
  }
);

export const updateUserLevel = createAsyncThunk(
  'auth/updateUserLevel',
  async (level: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const user = state.auth.user;
      
      if (!user) {
        return rejectWithValue('Kullanıcı oturumu bulunamadı');
      }

      if (user.firebase_uid) {
        await firestoreService.updateUserLevel(user.id, level);
      } else {
        const storageService = databaseService; // Using database service for all platforms
        await storageService.updateUserLevel(parseInt(user.id), level);
      }
      
      return level;
    } catch (error) {
      return rejectWithValue('Seviye güncellenirken hata oluştu');
    }
  }
);

// Firebase ile kayıt olma
export const registerWithFirebase = createAsyncThunk(
  'auth/registerWithFirebase',
  async (userData: RegisterData, { rejectWithValue }) => {
    try {
      // Firebase Authentication ile kayıt ol
      const result = await signUpWithEmailPassword(userData.email, userData.password);
      
      if (result.error) {
        return rejectWithValue(result.error);
      }
      
      if (!result.user) {
        return rejectWithValue('Kayıt işlemi başarısız');
      }
      
      // Firebase kullanıcısını Firestore'a kaydet
       const firebaseUser = result.user;
       const userData_for_firestore = {
         username: userData.username,
         email: firebaseUser.email || '',
         password_hash: '', // Firebase auth için gerekli değil
         current_level: 'A1',
         firebase_uid: firebaseUser.uid,
         created_at: new Date().toISOString(),
         updated_at: new Date().toISOString()
       };
       
       // Firestore'a kullanıcıyı kaydet
       const user = await firestoreService.createUser(userData_for_firestore);
      
      // AsyncStorage'a kaydet
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      return user;
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error.code) || error.message || 'Kayıt olurken bir hata oluştu';
      return rejectWithValue(errorMessage);
    }
  }
);

// Firebase ile giriş yapma
export const loginWithFirebase = createAsyncThunk(
  'auth/loginWithFirebase',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      // Firebase Authentication ile giriş yap
      const result = await signInWithEmailPassword(credentials.email, credentials.password);
      
      if (result.error) {
        return rejectWithValue(result.error);
      }
      
      if (!result.user) {
        return rejectWithValue('Giriş işlemi başarısız');
      }
      
      // Firebase kullanıcısını Firestore'dan al
      const firebaseUser = result.user;
      let user = await firestoreService.getUserByFirebaseUid(firebaseUser.uid);
      
      if (!user) {
        // Kullanıcı Firestore'da yoksa oluştur
        const userData = {
          username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email || '',
          password_hash: '', // Firebase auth için gerekli değil
          current_level: 'A1',
          firebase_uid: firebaseUser.uid,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        user = await firestoreService.createUser(userData);
      }
      
      console.log('User logged in with firebase_uid:', user.firebase_uid);
      
      // AsyncStorage'a kaydet
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      return user;
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = getFirebaseErrorMessage(error.code) || error.message || 'Giriş yapılırken bir hata oluştu';
      return rejectWithValue(errorMessage);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      // Check auth status
      .addCase(checkAuthStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
        }
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      // Update user level
      .addCase(updateUserLevel.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserLevel.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.user) {
          state.user.current_level = action.payload;
        }
        state.error = null;
      })
      .addCase(updateUserLevel.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Google Auth cases
      .addCase(loginWithGoogle.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      // Firebase Auth cases
      .addCase(registerWithFirebase.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerWithFirebase.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerWithFirebase.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      .addCase(loginWithFirebase.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithFirebase.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginWithFirebase.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, setLoading } = authSlice.actions;
export default authSlice.reducer;