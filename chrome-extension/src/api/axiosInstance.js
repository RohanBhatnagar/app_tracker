import axios from "axios";
import { BACKEND_API_BASE_URL } from "../config/env";
import { clearAuthTokens, getAuthTokens, setAuthTokens } from "./tokenStorage";

const axiosInstance = axios.create({
  baseURL: BACKEND_API_BASE_URL,
});

const refreshClient = axios.create({
  baseURL: BACKEND_API_BASE_URL,
});

let refreshPromise = null;

axiosInstance.interceptors.request.use(async (config) => {
  const { accessToken } = await getAuthTokens();

  if (accessToken) {
    config.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${accessToken}`,
    };
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !originalRequest?.url?.includes("/auth/token/refresh")
    ) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = (async () => {
            const { refreshToken } = await getAuthTokens();

            if (!refreshToken) {
              throw new Error("No refresh token available.");
            }

            const response = await refreshClient.post(
              "/auth/token/refresh",
              null,
              {
                headers: {
                  Authorization: `Bearer ${refreshToken}`,
                },
              }
            );

            const nextAccessToken = response.data.access_token;

            if (!nextAccessToken) {
              throw new Error("Refresh response did not include an access token.");
            }

            await setAuthTokens({ accessToken: nextAccessToken });
            return nextAccessToken;
          })().finally(() => {
            refreshPromise = null;
          });
        }

        const nextAccessToken = await refreshPromise;
        originalRequest.headers = {
          ...(originalRequest.headers || {}),
          Authorization: `Bearer ${nextAccessToken}`,
        };

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        await clearAuthTokens();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
