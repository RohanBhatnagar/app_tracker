import { authorizedGoogleRequest } from "./auth";

export async function fetchNewMessages(lastChecked) {
  const filter = `category:primary after:${Math.floor(lastChecked / 1000) - 5}`;
  const response = await authorizedGoogleRequest(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(
      filter
    )}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch Gmail messages: ${response.status}`);
  }

  const data = await response.json();
  return data.messages || [];
}

export async function fetchEmailContent(messageId) {
  const response = await authorizedGoogleRequest(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch Gmail message ${messageId}.`);
  }

  const data = await response.json();
  const subject =
    data.payload.headers.find((header) => header.name === "Subject")?.value || "";
  const from =
    data.payload.headers.find((header) => header.name === "From")?.value || "";

  let body = "";
  let parts = data.payload.parts;

  if (parts?.length) {
    for (let index = 0; index < parts.length; index += 1) {
      while (
        parts[index].mimeType === "multipart/alternative" ||
        parts[index].mimeType === "multipart/related"
      ) {
        parts = parts[index].parts;
      }

      if (
        parts[index].mimeType === "text/plain" ||
        parts[index].mimeType === "text/html"
      ) {
        if (!body || parts[index].body.data.length < body.data.length) {
          body = parts[index].body;
        }
      }
    }
  } else {
    body = data.payload.body;
  }

  return {
    body,
    from,
    subject,
  };
}

export async function processMessages(messages) {
  const processedMessages = [];

  for (const message of messages) {
    const emailContent = await fetchEmailContent(message.id);

    processedMessages.push({
      ...emailContent,
      id: message.id,
    });
  }

  return processedMessages;
}
