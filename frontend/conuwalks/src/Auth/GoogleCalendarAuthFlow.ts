import { AuthFlow, Tokens, UserInfo } from "./AuthFlow";

export class GoogleCalendarAuthFlow extends AuthFlow {
  private promptAsync: () => Promise<any>;
  private successCallback: () => void;

  constructor(promptAsync: () => Promise<any>, onSuccess: () => void) {
    super();
    this.promptAsync = promptAsync;
    this.successCallback = onSuccess;
  }

  protected async performAuth(): Promise<Tokens> {
    const result = await this.promptAsync();

    if (result?.type !== "success") {
      throw new Error(result?.type === "cancel" ? "Auth cancelled" : "Auth failed");
    }

    const { authentication } = result;
    if (!authentication?.accessToken) {
      throw new Error("No access token received");
    }

    return {
      accessToken: authentication.accessToken,
      idToken: authentication.idToken || "",
      expiryDate: Date.now() + 3600000,
    };
  }

  protected async fetchUserInfo(accessToken: string): Promise<UserInfo> {
    const response = await fetch("https://www.googleapis.com/userinfo/v2/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.status}`);
    }

    const userData = await response.json();

    return {
      id: userData.id || "",
      name: userData.name || "User",
      email: userData.email || "",
      photo: userData.picture || "",
    };
  }

  protected async onAuthSuccess(): Promise<void> {
    this.successCallback();
  }
}