import { getTokens, isTokenValid, clearTokens, saveTokens, saveUserInfo } from "../utils/tokenStorage";

export interface Tokens {
  accessToken: string;
  idToken: string;
  expiryDate: number;
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  photo: string;
}

export abstract class AuthFlow {

  async execute(): Promise<void> {
    try {
      const hasSession = await this.checkExistingSession();
      if (hasSession) {
        await this.onAuthSuccess();
        return;
      }
      const tokens = await this.performAuth();
      const user = await this.fetchUserInfo(tokens.accessToken);
      await this.saveSession(tokens, user);
      await this.onAuthSuccess();
    } catch (error) {
      await this.onAuthFailure(error);
      throw error;
    }
  }

  protected async checkExistingSession(): Promise<boolean> {
    try {
      const tokens = await getTokens();
      if (tokens && isTokenValid(tokens)) return true;
      await clearTokens();
      return false;
    } catch {
      return false;
    }
  }


  protected async saveSession(tokens: Tokens, user: UserInfo): Promise<void> {
    await saveTokens(tokens);
    await saveUserInfo({
      id: user.id,
      name: user.name,
      email: user.email,
      photo: user.photo,
    });
  }

 
  protected async onAuthFailure(error: unknown): Promise<void> {}

  protected abstract performAuth(): Promise<Tokens>;
  protected abstract fetchUserInfo(accessToken: string): Promise<UserInfo>;
  protected abstract onAuthSuccess(): Promise<void>;
}