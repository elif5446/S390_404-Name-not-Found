import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@auth_tokens';
const USER_INFO_KEY = '@user_info';

export const saveTokens = async (tokens: any) => {
  try {
    if (!tokens) throw new Error('No tokens to save');
    await AsyncStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    console.log('Tokens saved successfully');
  } catch (error) {
    console.error('Error saving tokens:', error);
  }
};

export const saveUserInfo = async (userInfo: any) => {
  try {
    if (!userInfo) throw new Error('No user info to save');
    // Only save if we have actual user data
    if (userInfo.name && userInfo.name !== 'User') {
      await AsyncStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
      console.log('User info saved successfully:', userInfo.name);
    } else {
      console.log('Skipping save of placeholder user info');
    }
  } catch (error) {
    console.error('Error saving user info:', error);
  }
};

export const getUserInfo = async () => {
  try {
    const userInfo = await AsyncStorage.getItem(USER_INFO_KEY);
    return userInfo ? JSON.parse(userInfo) : null;
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
};

export const getTokens = async () => {
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
    // Clear AsyncStorage completely
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_INFO_KEY);
    console.log('Local tokens and user info cleared');
    
    // Sign out of Google
    try {
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
      await GoogleSignin.signOut();
      console.log('Google Sign-Out successful');
    } catch (googleError) {
      console.error('Error during Google Sign-Out:', googleError);
    }
  } catch (error) {
    console.error('Error clearing tokens:', error);
  }
};

export const isTokenValid = (tokens: any) => {
  if (!tokens || !tokens.accessToken) return false;
  
  if (tokens.expiryDate) {
    const now = Date.now();
    // Buffer of 5 minutes to avoid edge cases
    return now < tokens.expiryDate - 300000;
  }
  
  return true;
};