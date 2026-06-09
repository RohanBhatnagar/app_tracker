function getRuntimeErrorMessage(fallbackMessage) {
  return chrome.runtime.lastError?.message || fallbackMessage;
}

export function getAuthToken(options = { interactive: true }) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken(options, (token) => {
      if (chrome.runtime.lastError || !token) {
        reject(new Error(getRuntimeErrorMessage("Failed to get auth token.")));
        return;
      }

      resolve(token);
    });
  });
}

export function getProfileUserInfo(options = { accountStatus: "ANY" }) {
  return new Promise((resolve, reject) => {
    chrome.identity.getProfileUserInfo(options, (userInfo) => {
      if (chrome.runtime.lastError || !userInfo?.email) {
        reject(
          new Error(getRuntimeErrorMessage("Failed to get Chrome profile info."))
        );
        return;
      }

      resolve(userInfo);
    });
  });
}

export function storageGet(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (result) => {
      if (chrome.runtime.lastError) {
        reject(
          new Error(getRuntimeErrorMessage("Failed to read from storage."))
        );
        return;
      }

      resolve(result);
    });
  });
}

export function storageSet(values) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(values, () => {
      if (chrome.runtime.lastError) {
        reject(
          new Error(getRuntimeErrorMessage("Failed to write to storage."))
        );
        return;
      }

      resolve();
    });
  });
}

export function storageRemove(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove(keys, () => {
      if (chrome.runtime.lastError) {
        reject(
          new Error(getRuntimeErrorMessage("Failed to remove storage values."))
        );
        return;
      }

      resolve();
    });
  });
}
