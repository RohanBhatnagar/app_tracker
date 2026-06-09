const COMPANY_INDEX = 1;
const ROLE_INDEX = 2;
const STATUS_INDEX = 3;

export { COMPANY_INDEX, ROLE_INDEX, STATUS_INDEX };

export function getFormattedDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${month}/${day}/${year}`;
}

export function parseExtractedEntity(data) {
  const parsed = data[0]
    .split('"')
    .filter((item) => item.length > 2 || item.includes("\\"));

  if (parsed.length < 3 || parsed[0] == null) {
    return null;
  }

  return {
    company: parsed[0].trim(),
    role: parsed[1]?.includes("null") ? "No role provided." : parsed[1]?.trim(),
    status: parsed[2]?.trim(),
    link: `https://mail.google.com/mail/u/0/#inbox/${data[1]}`,
  };
}

function getMatchingCharacters(s1, s2) {
  const matchingDistance = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);
  let matches = 0;

  for (let index = 0; index < s1.length; index += 1) {
    const start = Math.max(0, index - matchingDistance);
    const end = Math.min(index + matchingDistance + 1, s2.length);

    for (let candidateIndex = start; candidateIndex < end; candidateIndex += 1) {
      if (s2Matches[candidateIndex]) {
        continue;
      }

      if (s1[index] !== s2[candidateIndex]) {
        continue;
      }

      s1Matches[index] = true;
      s2Matches[candidateIndex] = true;
      matches += 1;
      break;
    }
  }

  return { matches, s1Matches, s2Matches };
}

function getTranspositions(s1, s2, s1Matches, s2Matches) {
  let transpositions = 0;
  let offset = 0;

  for (let index = 0; index < s1.length; index += 1) {
    if (!s1Matches[index]) {
      continue;
    }

    while (!s2Matches[offset]) {
      offset += 1;
    }

    if (s1[index] !== s2[offset]) {
      transpositions += 1;
    }

    offset += 1;
  }

  return transpositions / 2;
}

function jaroSimilarity(s1, s2) {
  const { matches, s1Matches, s2Matches } = getMatchingCharacters(s1, s2);

  if (matches === 0) {
    return 0;
  }

  const transpositions = getTranspositions(s1, s2, s1Matches, s2Matches);

  return (
    (matches / s1.length +
      matches / s2.length +
      (matches - transpositions) / matches) /
    3
  );
}

function commonPrefixLength(s1, s2, maxPrefixLength = 4) {
  const prefixLength = Math.min(s1.length, s2.length, maxPrefixLength);

  for (let index = 0; index < prefixLength; index += 1) {
    if (s1[index] !== s2[index]) {
      return index;
    }
  }

  return prefixLength;
}

export function jaroWinklerSimilarity(s1, s2, scalingFactor = 0.1) {
  const jaroScore = jaroSimilarity(s1, s2);
  const prefixLength = commonPrefixLength(s1, s2);

  return jaroScore + prefixLength * scalingFactor * (1 - jaroScore);
}
