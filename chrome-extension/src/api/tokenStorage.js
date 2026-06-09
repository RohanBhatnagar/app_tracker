import { storageGet, storageRemove, storageSet } from "../lib/chromeApi";

const ACCESS_TOKEN_KEY = "backendAccessToken";
const REFRESH_TOKEN_KEY = "backendRefreshToken";

export async function getAuthTokens() {
  const storedTokens = await storageGet([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);

  return {
    accessToken: storedTokens[ACCESS_TOKEN_KEY] || null,
    refreshToken: storedTokens[REFRESH_TOKEN_KEY] || null,
  };
}

export async function setAuthTokens({ accessToken, refreshToken }) {
  const nextValues = {};

  if (accessToken) {
    nextValues[ACCESS_TOKEN_KEY] = accessToken;
  }

  if (refreshToken) {
    nextValues[REFRESH_TOKEN_KEY] = refreshToken;
  }

  if (Object.keys(nextValues).length > 0) {
    await storageSet(nextValues);
  }
}

export async function clearAuthTokens() {
  await storageRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
}
