const fs = require("fs");
const path = require("path");

function stripWrappingQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function parseEnvFile(envPath) {
  if (!fs.existsSync(envPath)) {
    return {};
  }

  const fileContents = fs.readFileSync(envPath, "utf8");

  return fileContents.split(/\r?\n/).reduce((accumulator, rawLine) => {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      return accumulator;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      return accumulator;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = stripWrappingQuotes(line.slice(separatorIndex + 1).trim());

    if (key) {
      accumulator[key] = value;
    }

    return accumulator;
  }, {});
}

function loadEnv(explicitEnvPath) {
  const envPath = explicitEnvPath || path.resolve(process.cwd(), ".env");
  const fileEnv = parseEnvFile(envPath);

  return {
    ...fileEnv,
    ...process.env,
  };
}

module.exports = {
  loadEnv,
};
