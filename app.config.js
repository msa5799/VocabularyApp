import 'dotenv/config';

export default {
  expo: {
    name: "VocabularyApp",
    slug: "VocabularyApp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.mehmetsahinakkaya.VocabularyApp"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      package: "com.mehmetsahinakkaya.vocabularyapp"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-font"
    ],
    extra: {
      googleTranslateApiKey: process.env.GOOGLE_TRANSLATE_API_KEY || '',
      eas: {
        projectId: "95569b81-62ea-4c88-ac21-23a50bf41794"
      }
    }
  }
};