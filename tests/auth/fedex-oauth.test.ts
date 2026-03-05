import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

describe("FedExAuthManager", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.FEDEX_CLIENT_ID = "test-client-id";
    process.env.FEDEX_CLIENT_SECRET = "test-client-secret";
    process.env.FEDEX_ENV = "sandbox";
  });

  it("fetches and caches a token", async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({
      data: { access_token: "test-token-123", token_type: "bearer", expires_in: 3600 },
    });

    const { authManager } = await import("../../src/auth/fedex-oauth.js");
    const token = await authManager.getToken();

    expect(token).toBe("test-token-123");
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);

    // Second call should use cache
    const token2 = await authManager.getToken();
    expect(token2).toBe("test-token-123");
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  it("throws when credentials are missing", async () => {
    delete process.env.FEDEX_CLIENT_ID;
    const { authManager } = await import("../../src/auth/fedex-oauth.js");
    authManager.invalidate();

    mockedAxios.post = vi.fn().mockRejectedValue(new Error("FEDEX_CLIENT_ID environment variable is not set"));

    await expect(authManager.getToken()).rejects.toThrow();
  });
});
