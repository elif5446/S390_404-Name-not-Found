import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@google_calendar_tokens';

export interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiryDate: number; // timestamp
}

export const saveTokens = async (tokens: TokenData) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  } catch (error) {
    console.error('Error saving tokens:', error);
  }
};

export const getTokens = async (): Promise<TokenData | null> => {
  try {
    const tokens = await AsyncStorage.getItem(TOKEN_KEY);
    return tokens ? JSON.parse(tokens) : null;
  } catch (error) {
    console.error('Error getting tokens:', error);
    return null;
  }
};

export const clearTokens = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error clearing tokens:', error);
  }
};

export const isTokenValid = (tokenData: TokenData): boolean => {
  return tokenData.expiryDate > Date.now();
};