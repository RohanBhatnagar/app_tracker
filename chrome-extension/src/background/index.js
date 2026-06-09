import { BACKEND_API_BASE_URL, GMAIL_POLL_INTERVAL_MINUTES } from "../config/env";
import { authenticateUser } from "./auth";
import {
  classifySubjects,
  extractEntities,
  getLastTimestamp,
  updateTimestamp,
} from "./backend";
import { fetchNewMessages, processMessages } from "./gmail";
import { deleteSheetRow, updateSheet, updateSheetStatus } from "./sheets";

const CHECK_EMAIL_ALARM = "checkEmail";

async function checkEmails() {
  const now = Date.now();

  try {
    await authenticateUser({ interactive: false });
    const lastChecked = await getLastTimestamp();
    const messages = await fetchNewMessages(lastChecked);

    if (messages.length > 0) {
      const processedMessages = await processMessages(messages);
      const predictions = await classifySubjects(processedMessages);
      const extractableMessages = processedMessages.filter(
        (_, index) => predictions[index] === "Yes"
      );

      if (extractableMessages.length > 0) {
        const entities = await extractEntities(extractableMessages);

        for (const entity of entities) {
          await updateSheet(entity, false);
        }
      }
    }

    await updateTimestamp(now);
  } catch (error) {
    console.error("Error during background email check:", error);
  }
}

function sendSuccess(sendResponse, message, data = {}) {
  sendResponse({
    data,
    message,
    success: true,
  });
}

function sendFailure(sendResponse, error, fallbackMessage) {
  sendResponse({
    message: error?.message || fallbackMessage,
    success: false,
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handlers = {
    async AUTHORIZE() {
      const authState = await authenticateUser({ interactive: true });
      sendSuccess(sendResponse, "Authorized successfully.", authState);
    },
    async DELETE_ROW() {
      await deleteSheetRow(message.data.company, message.data.role);
      sendSuccess(sendResponse, "Entry deleted.");
    },
    async MANUAL_ENTRY() {
      await updateSheet(message.data, true);
      sendSuccess(sendResponse, "Entry added.");
    },
    async UPDATE_STATUS() {
      await updateSheetStatus(
        message.data.company,
        message.data.role,
        message.data.status
      );
      sendSuccess(sendResponse, "Status updated.");
    },
  };

  const handler = handlers[message.action];

  if (!handler) {
    sendResponse({ message: "Unknown action.", success: false });
    return false;
  }

  handler().catch((error) =>
    sendFailure(sendResponse, error, `Failed to handle ${message.action}.`)
  );

  return true;
});

chrome.runtime.onInstalled.addListener(() => {
  authenticateUser({ interactive: true }).catch((error) => {
    console.error("Failed to authenticate on install:", error);
  });

  chrome.alarms.create(CHECK_EMAIL_ALARM, {
    periodInMinutes: GMAIL_POLL_INTERVAL_MINUTES,
  });
});

chrome.runtime.onStartup.addListener(() => {
  authenticateUser({ interactive: false }).catch((error) => {
    console.error("Failed to authenticate on startup:", error);
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === CHECK_EMAIL_ALARM) {
    checkEmails();
  }
});

console.debug(`Extension backend configured for ${BACKEND_API_BASE_URL}`);
