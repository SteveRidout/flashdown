const normalizedCharacterMap: { [nonNormalizedCharacter: string]: string } = {
  ï: "i",
  à: "a",
  á: "a",
  â: "a",
  ã: "a",
  ç: "c",
  é: "e",
  ê: "e",
  í: "i",
  ô: "o",
  õ: "o",
  ñ: "n",
  ú: "u",
  "-": " ",
};

export const normalizeAnswer = (answer: string) =>
  answer
    .split("")
    .map((character) => normalizedCharacterMap[character] ?? character)
    .join("")
    // Strip out all characters which aren't word or space characters
    .replace(/[^\w\s]/g, "")
    // Replace consecutive whitespace with single space
    .replace(/[\s]+/g, " ")
    .trim()
    .toLowerCase();

type EditDistanceMatch = "exact" | "almost" | "different";

export const editDistance = (
  a: string,
  b: string,
  diffSoFar: number = 0
): EditDistanceMatch => {
  if (a.length === 0 && b.length === 0) {
    return diffSoFar === 0 ? "exact" : "almost";
  }

  if (Math.abs(a.length - b.length) > 1) {
    return "different";
  }

  if (a[0] === b[0]) {
    return editDistance(a.substring(1), b.substring(1), diffSoFar);
  }

  if (diffSoFar > 0) {
    return "different";
  }

  // Substitution
  if (a[0] === b[1] && a[1] === b[0]) {
    return editDistance(a.substring(2), b.substring(2), 1);
  }

  if (a[1] === b[1]) {
    return editDistance(a.substring(2), b.substring(2), 1);
  }

  if (a[0] === b[1]) {
    return editDistance(a.substring(1), b.substring(2), 1);
  }

  if (a[1] === b[0]) {
    return editDistance(a.substring(2), b.substring(1), 1);
  }

  return editDistance(a.substring(1), b.substring(1), 1);
};
