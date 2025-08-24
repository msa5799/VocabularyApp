import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import wordsSlice from './slices/wordsSlice';
import testsSlice from './slices/testsSlice';
import progressSlice from './slices/progressSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    words: wordsSlice,
    tests: testsSlice,
    progress: progressSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;