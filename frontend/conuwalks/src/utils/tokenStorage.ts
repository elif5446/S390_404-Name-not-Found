import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "@auth_tokens";
const USER_INFO_KEY = "@user_info";
const CLASS_REMINDER_LEAD_TIME_KEY = "@class_reminder_lead_time";
const DISMISSED_CLASS_EVENT_IDS_KEY = "@dismissed_class_event_ids";
const VALID_REMINDER_MINUTES = [0, 5, 10, 15, 30] as const;
export const DEFAULT_CLASS_REMINDER_LEAD_TIME_MINUTES = 10;

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
    if (!tokens?.accessToken) {
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
    const tokenString = await AsyncStorage.getItem(TOKEN_KEY);
    
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_INFO_KEY);
    await AsyncStorage.removeItem(CLASS_REMINDER_LEAD_TIME_KEY);
    await AsyncStorage.removeItem(DISMISSED_CLASS_EVENT_IDS_KEY);
    console.log("Local tokens and user info cleared");

    if (tokenString) {
      const { accessToken } = JSON.parse(tokenString);
      if (accessToken) {
        try {
          await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${accessToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
          });
          console.log("Google Token Revoked successfully");
        } catch (revokeError) {
          console.error("Note: Could not revoke token remotely, but local data is cleared.", revokeError);
        }
      }
    }
  } catch (error) {
    console.error("Error clearing tokens:", error);
  }
};

export const isTokenValid = (tokens: AuthTokens | null): boolean => {
  if (!tokens?.accessToken) return false;

  if (tokens.expiryDate) {
    const now = Date.now();
    // buffer of 5 minutes to avoid edge cases during network requests
    return now < tokens.expiryDate - 300000;
  }

  return true;
};

export const saveClassReminderLeadTime = async (
  minutes: number,
): Promise<boolean> => {
  try {
    if (!VALID_REMINDER_MINUTES.includes(minutes as any)) {
      throw new Error(`Invalid reminder value: ${minutes}`);
    }

    await AsyncStorage.setItem(CLASS_REMINDER_LEAD_TIME_KEY, String(minutes));
    return true;
  } catch (error) {
    console.error("Error saving class reminder lead time:", error);
    return false;
  }
};

export const getClassReminderLeadTime = async (): Promise<number> => {
  try {
    const raw = await AsyncStorage.getItem(CLASS_REMINDER_LEAD_TIME_KEY);
    if (!raw) return DEFAULT_CLASS_REMINDER_LEAD_TIME_MINUTES;

    const parsed = Number(raw);
    if (!VALID_REMINDER_MINUTES.includes(parsed as any)) {
      return DEFAULT_CLASS_REMINDER_LEAD_TIME_MINUTES;
    }

    return parsed;
  } catch (error) {
    console.error("Error reading class reminder lead time:", error);
    return DEFAULT_CLASS_REMINDER_LEAD_TIME_MINUTES;
  }
};

export const getDismissedClassEventIds = async (): Promise<string[]> => {
  try {
    const raw = await AsyncStorage.getItem(DISMISSED_CLASS_EVENT_IDS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((value) => typeof value === "string");
  } catch (error) {
    console.error("Error reading dismissed class event ids:", error);
    return [];
  }
};

export const saveDismissedClassEventIds = async (
  ids: string[],
): Promise<boolean> => {
  try {
    const uniqueIds = Array.from(new Set(ids.filter((id) => typeof id === "string")));
    await AsyncStorage.setItem(
      DISMISSED_CLASS_EVENT_IDS_KEY,
      JSON.stringify(uniqueIds),
    );
    return true;
  } catch (error) {
    console.error("Error saving dismissed class event ids:", error);
    return false;
  }
};
