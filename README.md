# SafeRoute Expo 🛡️

A comprehensive safety-focused mobile application built with React Native and Expo, designed to help users navigate safely and manage emergency contacts with real-time location tracking.

## 📱 Project Overview

SafeRoute Expo is a cross-platform mobile application that prioritizes user safety by providing:
- **Smart Route Planning** with safety analysis
- **Emergency Contact Management** with quick SOS features
- **Real-time Location Tracking** and sharing
- **Offline-first Architecture** using SQLite database
- **Shake-to-SOS** emergency feature
- **Dark/Light Theme** support

## 🏗️ Architecture

The application follows a **modular, context-driven architecture** with:

### **Frontend Architecture**
```
├── src/
│   ├── screens/           # Screen components
│   ├── navigation/        # Navigation configuration
│   ├── context/          # React Context providers
│   ├── services/         # Business logic & API layer
│   ├── features/         # Feature-specific hooks & components
│   └── utils/           # Utility functions
```

### **Data Architecture**
- **Local Database**: SQLite for offline-first data storage
- **Authentication**: JWT-like session tokens with local validation
- **State Management**: React Context API
- **Storage**: AsyncStorage for session persistence

## 🚀 Features

### 🔐 **Authentication System**
- User registration and login
- Secure password hashing with salt
- Session-based authentication
- Offline-capable user management

### 🗺️ **Navigation & Safety**
- Interactive map with React Native Maps
- Real-time location tracking
- Safety score analysis for routes
- Saved addresses management

### 🆘 **Emergency Features**
- Quick SOS button
- Shake-to-activate emergency
- Emergency contact management
- Location sharing with contacts

### 👤 **User Management**
- User profiles with customization
- Dark/Light theme preferences
- Emergency contact setup
- Address book management

## 🛠️ Technology Stack

### **Frontend**
- **React Native** (0.81.4) - Cross-platform mobile development
- **Expo SDK** (~51.0.0) - Development platform
- **TypeScript** (~5.9.2) - Type safety
- **React Navigation** (v7) - Navigation library

### **UI/UX**
- **React Native Maps** - Interactive mapping
- **Expo Linear Gradient** - Beautiful gradients
- **React Native Reanimated** - Smooth animations
- **Expo Status Bar** - Status bar management

### **Data & Storage**
- **SQLite** (via expo-sqlite) - Local database
- **AsyncStorage** - Session & preferences storage
- **Expo Crypto** - Secure hashing & token generation

### **Device Features**
- **Expo Location** - GPS & location services
- **Expo Sensors** - Shake detection for SOS
- **Expo Device** - Device information
- **React Native Gesture Handler** - Touch gestures

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Expo CLI** (`npm install -g @expo/cli`)
- **Expo Go** app (for testing on physical device)

### For Development:
- **Android Studio** (for Android emulator)
- **Xcode** (for iOS simulator - macOS only)

## 🔧 Installation & Setup

### 1. **Clone the Repository**
```bash
git clone <repository-url>
cd SafeRouteExpo
```

### 2. **Install Dependencies**
```bash
npm install
```

### 3. **Start Development Server**
```bash
npm start
# or
expo start
```

### 4. **Run on Device/Emulator**
```bash
# Android
npm run android

# iOS
npm run ios

# Web (for testing)
npm run web
```

## 📱 Usage

### **First Time Setup**
1. **Create Account**: Register with email and password
2. **Setup Profile**: Add your name and preferences
3. **Add Emergency Contacts**: Configure trusted contacts
4. **Set Location Permissions**: Enable location services
5. **Test SOS Feature**: Verify emergency functionality

### **Daily Usage**
1. **Plan Routes**: Use the navigation tab for safe routing
2. **Monitor Safety**: Check area safety scores
3. **Emergency Access**: Use SOS button or shake feature
4. **Manage Data**: Update contacts and addresses as needed

## 🗂️ Project Structure

```
SafeRouteExpo/
├── src/
│   ├── screens/
│   │   ├── auth/                    # Authentication screens
│   │   │   ├── LoginScreen.tsx
│   │   │   └── SignupScreen.tsx
│   │   ├── profile/                 # Profile management screens
│   │   │   ├── EditProfileScreen.tsx
│   │   │   ├── EmergencyContactsScreen.tsx
│   │   │   └── SavedAddressesScreen.tsx
│   │   ├── MapScreen.tsx            # Main navigation screen
│   │   └── ProfileScreen.tsx        # User profile screen
│   │
│   ├── navigation/
│   │   └── ProfileStack.tsx         # Profile navigation stack
│   │
│   ├── context/
│   │   ├── AuthContext.tsx          # Authentication state
│   │   ├── ThemeContext.tsx         # Theme management
│   │   └── SOSContext.tsx           # Emergency features
│   │
│   ├── services/
│   │   ├── sqlite.ts                # Database operations
│   │   ├── firebaseClient.ts        # Auth service (SQLite backend)
│   │   ├── userService.ts           # User management
│   │   ├── profileService.ts        # Profile operations
│   │   ├── addressService.ts        # Address management
│   │   └── contactsService.ts       # Emergency contacts
│   │
│   ├── features/
│   │   └── sos/
│   │       └── useShakeSOS.ts       # Shake detection hook
│   │
│   └── utils/
│       └── safetyAnalysis.ts        # Safety scoring utilities
│
├── assets/                          # Static assets
├── docs/                           # Documentation files
├── App.tsx                         # Main app component
├── index.ts                        # Entry point
├── app.config.ts                   # Expo configuration
├── package.json                    # Dependencies
└── tsconfig.json                   # TypeScript configuration
```

## 🔒 Security Features

- **Password Hashing**: SHA-256 with salt
- **Session Management**: Secure token-based authentication
- **Local Storage**: SQLite database with proper data isolation
- **Permission Management**: Granular location & sensor permissions

## 📊 Database Schema

See `docs/DATABASE_SCHEMA.md` for detailed database structure.

## 🔗 API Documentation

See `docs/API_DOCUMENTATION.md` for complete API reference.

## 🎨 Architecture Diagram

See `docs/ARCHITECTURE_DIAGRAM.md` for visual system overview.

## 🧪 Testing

```bash
# Run the app in development mode
npm start

# Test on physical device using Expo Go
# Scan QR code from terminal

# Test specific platforms
npm run android  # Android emulator
npm run ios      # iOS simulator
npm run web      # Web browser
```

## 🚀 Deployment

### **Build for Production**
```bash
# Build Android APK
expo build:android

# Build iOS IPA
expo build:ios

# Or using EAS Build (recommended)
npx eas-cli build
```

## 📈 Performance Optimizations

- **Offline-first**: SQLite database for local data
- **Lazy Loading**: Screen-based code splitting
- **Optimized Images**: Compressed assets
- **Memory Management**: Proper cleanup of subscriptions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support, please contact:
- **Developer**: Paarth Goswami
- **Email**: paarthgoswami44@gmail.com

## 🔄 Version History

### v1.0.0 (Current)
- Initial release
- SQLite-based authentication
- Emergency contact management
- Real-time location tracking
- Cross-platform compatibility

---

**Built with ❤️ using React Native & Expo**