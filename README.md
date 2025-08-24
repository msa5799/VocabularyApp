# VocabularyApp 📚

A comprehensive vocabulary learning application built with React Native and Expo, featuring CEFR level testing, spaced repetition learning, and real-time translation capabilities.

## 🌟 Features

### Core Learning Features
- **CEFR Level Assessment**: Comprehensive testing system to determine your English proficiency level (A1-C2)
- **Spaced Repetition Algorithm**: Optimized learning schedule based on forgetting curve
- **Daily Practice**: Personalized daily vocabulary exercises
- **Progress Tracking**: Detailed statistics and learning analytics
- **Real-time Translation**: Integrated translation services for instant word lookup

### User Experience
- **Cross-platform**: Works on Web, iOS, and Android
- **Offline Support**: Continue learning without internet connection
- **Modern UI**: Clean, intuitive interface with Material Design principles
- **Responsive Design**: Optimized for all screen sizes

### Technical Features
- **Backend Integration**: Node.js backend with web scraping capabilities
- **Database**: SQLite for local storage, Firebase for cloud sync
- **State Management**: Redux Toolkit for efficient state handling
- **Authentication**: Google Auth integration

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/msa5799/VocabularyApp.git
   cd VocabularyApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env file with your API keys
   ```

5. **Start the backend server**
   ```bash
   cd backend
   npm start
   ```

6. **Start the development server**
   ```bash
   npm start
   ```

### Running on Different Platforms

- **Web**: `npm run web` or press `w` in the Expo CLI
- **iOS**: `npm run ios` or press `i` in the Expo CLI
- **Android**: `npm run android` or press `a` in the Expo CLI

## 📱 Screenshots

*Screenshots will be added soon*

## 🏗️ Project Structure

```
VocabularyApp/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # Application screens
│   │   ├── auth/           # Authentication screens
│   │   ├── dashboard/      # Main app screens
│   │   ├── dictionary/     # Dictionary features
│   │   ├── profile/        # User profile screens
│   │   └── tests/          # Testing screens
│   ├── navigation/         # Navigation configuration
│   ├── services/           # API and external services
│   ├── store/             # Redux store and slices
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── backend/               # Node.js backend server
├── assets/               # Static assets
└── android/              # Android-specific files
```

## 🛠️ Technologies Used

### Frontend
- **React Native** - Cross-platform mobile development
- **Expo** - Development platform and tools
- **TypeScript** - Type-safe JavaScript
- **Redux Toolkit** - State management
- **React Navigation** - Navigation library
- **React Native Paper** - Material Design components

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **Cheerio** - Web scraping
- **Axios** - HTTP client
- **Google Gemini AI** - AI-powered features

### Database & Storage
- **SQLite** - Local database
- **Firebase** - Cloud database and authentication
- **AsyncStorage** - Local storage for React Native

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
GOOGLE_TRANSLATE_API_KEY=your_google_translate_api_key
GEMINI_API_KEY=your_gemini_api_key
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
```

## 📈 Development Roadmap

- [x] Basic vocabulary learning system
- [x] CEFR level testing
- [x] Web platform support
- [x] Backend API integration
- [ ] Enhanced progress analytics
- [ ] Social features (friends, leaderboards)
- [ ] Audio pronunciation features
- [ ] Offline mode improvements
- [ ] Advanced search and filtering
- [ ] Daily goals and notifications

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Mehmet Sahin Akkaya**
- GitHub: [@msa5799](https://github.com/msa5799)

## 🙏 Acknowledgments

- Cambridge Dictionary for vocabulary data
- Google Translate for translation services
- Expo team for the amazing development platform
- React Native community for continuous support

---

⭐ If you found this project helpful, please give it a star!