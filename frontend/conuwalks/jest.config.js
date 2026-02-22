module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/jest.setup.js'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)",
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '@react-native-async-storage/async-storage': require.resolve(
      '@react-native-async-storage/async-storage/jest/async-storage-mock'
    ),
    '@react-native-google-signin/google-signin': '<rootDir>/jest.setup.js',
  },
};
