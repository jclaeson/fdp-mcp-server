import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { randomUUID } from "crypto";
import { authManager } from "../auth/fedex-oauth.js";

function getBaseUrl(): string {
  const env = process.env.FEDEX_ENV ?? "sandbox";
  return env === "production"
    ? "https://apis.fedex.com"
    : "https://apis-sandbox.fedex.com";
}

function createFedExClient(): AxiosInstance {
  const client = axios.create({
    baseURL: getBaseUrl(),
    timeout: 30000,
    headers: { "Content-Type": "application/json" },
  });

  // Inject auth token and transaction ID on every request
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await authManager.getToken();
      config.headers["Authorization"] = `Bearer ${token}`;
      config.headers["x-customer-transaction-id"] = randomUUID();
      return config;
    }
  );

  // On 401, refresh token and retry once
  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error) => {
      const originalRequest = error.config as AxiosRequestConfig & {
        _retried?: boolean;
      };
      if (error.response?.status === 401 && !originalRequest._retried) {
        originalRequest._retried = true;
        authManager.invalidate();
        const token = await authManager.getToken();
        if (originalRequest.headers) {
          (originalRequest.headers as Record<string, string>)[
            "Authorization"
          ] = `Bearer ${token}`;
        }
        return client(originalRequest);
      }
      return Promise.reject(normalizeFedExError(error));
    }
  );

  return client;
}

export interface FedExApiError {
  message: string;
  code?: string;
  details?: unknown;
}

function normalizeFedExError(error: unknown): FedExApiError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { errors?: { message: string; code: string }[] }
      | undefined;
    const firstError = data?.errors?.[0];
    if (firstError) {
      return {
        message: firstError.message,
        code: firstError.code,
        details: data.errors,
      };
    }
    return {
      message: error.message,
      code: String(error.response?.status ?? "NETWORK_ERROR"),
    };
  }
  return { message: String(error) };
}

export const fedexClient = createFedExClient();
