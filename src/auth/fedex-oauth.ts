import axios from "axios";

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

// Refresh 5 minutes before actual expiry
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

class FedExAuthManager {
  private cached: CachedToken | null = null;
  private refreshPromise: Promise<string> | null = null;

  private get baseUrl(): string {
    const env = process.env.FEDEX_ENV ?? "sandbox";
    return env === "production"
      ? "https://apis.fedex.com"
      : "https://apis-sandbox.fedex.com";
  }

  private get clientId(): string {
    const id = process.env.FEDEX_CLIENT_ID;
    if (!id) throw new Error("FEDEX_CLIENT_ID environment variable is not set");
    return id;
  }

  private get clientSecret(): string {
    const secret = process.env.FEDEX_CLIENT_SECRET;
    if (!secret)
      throw new Error("FEDEX_CLIENT_SECRET environment variable is not set");
    return secret;
  }

  private isTokenValid(): boolean {
    if (!this.cached) return false;
    return Date.now() < this.cached.expiresAt - REFRESH_BUFFER_MS;
  }

  private async fetchToken(): Promise<string> {
    const params = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });

    const response = await axios.post<TokenResponse>(
      `${this.baseUrl}/oauth/token`,
      params.toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 15000,
      }
    );

    const { access_token, expires_in } = response.data;
    this.cached = {
      accessToken: access_token,
      expiresAt: Date.now() + expires_in * 1000,
    };

    return access_token;
  }

  async getToken(): Promise<string> {
    if (this.isTokenValid()) {
      return this.cached!.accessToken;
    }

    // Deduplicate concurrent refresh requests
    if (!this.refreshPromise) {
      this.refreshPromise = this.fetchToken().finally(() => {
        this.refreshPromise = null;
      });
    }

    return this.refreshPromise;
  }

  /** Force a token refresh (e.g. after a 401 response) */
  invalidate(): void {
    this.cached = null;
  }
}

// Singleton instance shared across all tools
export const authManager = new FedExAuthManager();
