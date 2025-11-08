module.exports = {
  // Yeh line Expo ke liye TypeScript/Babel settings ko automatically setup karti hai
  preset: 'jest-expo',

  // Yeh line Jest ko batati hai ki woh "node_modules" ko transform kare
  // (lekin sirf unhe jo Expo/React Native se jude hain)
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg))',
  ],

  // (Optional, lekin achha hai) Setup files
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
};