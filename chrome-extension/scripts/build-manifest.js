const fs = require("fs");
const path = require("path");
const { loadEnv } = require("./loadEnv");

const extensionRoot = path.resolve(__dirname, "..");
const env = loadEnv(path.join(extensionRoot, ".env"));
const manifestTemplatePath = path.join(
  extensionRoot,
  "manifest.template.json"
);
const manifestOutputPath = path.join(extensionRoot, "manifest.json");

function getRequiredEnv(name) {
  const value = env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function buildManifest() {
  const backendApiBaseUrl = getRequiredEnv("EXTENSION_API_BASE_URL");
  const googleOauthClientId = getRequiredEnv("GOOGLE_OAUTH_CLIENT_ID");
  const backendApiOrigin = new URL(backendApiBaseUrl).origin;
  const template = JSON.parse(fs.readFileSync(manifestTemplatePath, "utf8"));

  const manifest = {
    ...template,
    host_permissions: template.host_permissions.map((permission) =>
      permission.replaceAll("__EXTENSION_API_ORIGIN__", backendApiOrigin)
    ),
    oauth2: {
      ...template.oauth2,
      client_id: googleOauthClientId,
    },
    content_security_policy: {
      ...template.content_security_policy,
      extension_pages:
        template.content_security_policy.extension_pages.replaceAll(
          "__EXTENSION_API_ORIGIN__",
          backendApiOrigin
        ),
    },
  };

  fs.writeFileSync(manifestOutputPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

buildManifest();
