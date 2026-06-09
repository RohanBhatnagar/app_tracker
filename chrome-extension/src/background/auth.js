import axios from "axios";

import { BACKEND_API_BASE_URL } from "../config/env";
import { setAuthTokens } from "../api/tokenStorage";
import { getAuthToken, getProfileUserInfo } from "../lib/chromeApi";
import { setState, state } from "./state";

export async function authenticateUser(options = { interactive: true }) {
  const googleAccessToken = await getAuthToken(options);
  const userInfo = await getProfileUserInfo({ accountStatus: "ANY" });
  const response = await axios.post(
    `${BACKEND_API_BASE_URL}/auth/login`,
    { email: userInfo.email },
    {
      headers: {
        Authorization: `Bearer ${googleAccessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  const { access_token: accessToken, refresh_token: refreshToken } =
    response.data || {};

  if (!accessToken || !refreshToken) {
    throw new Error("Backend login did not return both JWT tokens.");
  }

  await setAuthTokens({ accessToken, refreshToken });
  setState({
    email: userInfo.email,
    googleAccessToken,
  });

  return {
    accessToken,
    email: userInfo.email,
    googleAccessToken,
    refreshToken,
  };
}

export async function authorizedGoogleRequest(
  url,
  requestOptions = {},
  retryOnUnauthorized = true
) {
  if (!state.googleAccessToken) {
    await authenticateUser({ interactive: true });
  }

  const response = await fetch(url, {
    ...requestOptions,
    headers: {
      ...(requestOptions.headers || {}),
      Authorization: `Bearer ${state.googleAccessToken}`,
    },
  });

  if (response.status === 401 && retryOnUnauthorized) {
    await authenticateUser({ interactive: false });
    return authorizedGoogleRequest(url, requestOptions, false);
  }

  return response;
}
