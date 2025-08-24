// Google Cloud Translation API Configuration

// For production, you should use environment variables or secure key management
// For development, you can use a service account key file

export interface GoogleTranslateConfig {
  projectId?: string;
  keyFilename?: string;
  apiKey?: string;
}

// Default configuration - you can override these values
export const defaultConfig: GoogleTranslateConfig = {
  // Option 1: Use API Key (simpler for client-side apps)
  apiKey: process.env.GOOGLE_TRANSLATE_API_KEY || '',
  
  // Option 2: Use Service Account (more secure for server-side)
  // projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || '',
  // keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
};

// Fallback to REST API if Cloud SDK is not available
export const GOOGLE_TRANSLATE_REST_API = 'https://translation.googleapis.com/language/translate/v2';

// Supported languages
export const SUPPORTED_LANGUAGES = {
  'en': 'English',
  'tr': 'Turkish',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese',
  'ar': 'Arabic'
};