import axiosInstance from "../api/axiosInstance";
import { resetUserCache, setState, state } from "./state";

export async function getLastTimestamp() {
  const response = await axiosInstance.get(
    `/protected/user/${state.email}/lastChecked`
  );

  return response.data.lastChecked;
}

export async function updateTimestamp(timestamp) {
  await axiosInstance.put(`/protected/user/${state.email}`, {
    lastChecked: timestamp,
  });
}

export async function classifySubjects(messages) {
  const subjects = messages.map((message) => message.subject);
  const response = await axiosInstance.post(`/protected/inference/classify`, {
    subjects,
  });

  return response.data.predictions || [];
}

export async function extractEntities(messages) {
  const response = await axiosInstance.post(`/protected/extract/entities`, {
    messages,
  });

  return response.data.entities || [];
}

export async function ensureUserContext() {
  if (state.user && state.spreadsheetId) {
    return state.user;
  }

  const response = await axiosInstance.get(`/protected/user/${state.email}`);
  const user = response.data;

  setState({
    row: user.recents.length,
    spreadsheetId: user.spreadsheetId,
    user,
  });

  return user;
}

export async function recordRecent(updateData) {
  await axiosInstance.put(`/protected/user/sheetupdate`, {
    updateData,
  });
  resetUserCache();
}

export async function deleteRecent(company, role) {
  await axiosInstance.delete(`/protected/user/${state.email}/recents/delete`, {
    data: {
      company,
      role,
    },
  });
  resetUserCache();
}

export async function updateRecentStatus(company, role, status) {
  await axiosInstance.put(`/protected/user/${state.email}/recents/status`, {
    company,
    role,
    status,
  });
  resetUserCache();
}
