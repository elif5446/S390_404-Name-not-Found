import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

const TOKEN_KEY = "@auth_tokens";
const USER_INFO_KEY = "@user_info";

export interface AuthTokens {
  accessToken: string;
  idToken?: string;
  expiryDate?: number;
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  photo: string;
}

export const saveTokens = async (tokens: AuthTokens): Promise<boolean> => {
  try {
    if (!tokens || !tokens.accessToken) {
      throw new Error("Invalid tokens provided");
    }
    await AsyncStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    console.log("Tokens saved successfully");
    return true;
  } catch (error) {
    console.error("Error saving tokens:", error);
    return false;
  }
};

export const saveUserInfo = async (userInfo: UserInfo): Promise<boolean> => {
  try {
    if (!userInfo) throw new Error("No user info to save");

    // save if we have actual user data
    if (userInfo.name && userInfo.name !== "User") {
      await AsyncStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
      console.log(`User info saved successfully: ${userInfo.name}`);
      return true;
    } else {
      console.log("Skipping save of placeholder user info");
      return false;
    }
  } catch (error) {
    console.error("Error saving user info:", error);
    return false;
  }
};

export const getUserInfo = async (): Promise<UserInfo | null> => {
  try {
    const userInfo = await AsyncStorage.getItem(USER_INFO_KEY);
    return userInfo ? JSON.parse(userInfo) : null;
  } catch (error) {
    console.error("Error getting user info:", error);
    return null;
  }
};

export const getTokens = async (): Promise<AuthTokens | null> => {
  try {
    const tokens = await AsyncStorage.getItem(TOKEN_KEY);
    return tokens ? JSON.parse(tokens) : null;
  } catch (error) {
    console.error("Error getting tokens:", error);
    return null;
  }
};

export const clearTokens = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_INFO_KEY);
    console.log('Local tokens and user info cleared');
    
    try {
      await GoogleSignin.signOut();
      console.log('Google Sign-Out successful');
    } catch (googleError) {
      // the user wasn't signed in, or the native bridge fails, we just log it.
      console.log('Note: Google Sign-Out threw an error (likely already signed out):', googleError);
    }
    
  } catch (error) {
    console.error('Error clearing tokens:', error);
  }
};

export const isTokenValid = (tokens: AuthTokens | null): boolean => {
  if (!tokens || !tokens.accessToken) return false;

  if (tokens.expiryDate) {
    const now = Date.now();
    // buffer of 5 minutes to avoid edge cases during network requests
    return now < tokens.expiryDate - 300000;
  }

  return true;
};
