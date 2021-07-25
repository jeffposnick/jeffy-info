export const HASH_CHARS = 8;

const DUMMY_BASE_URL = 'https://example.com/';

function getOriginalFilename(hashedFilename: string): string {
  return hashedFilename.substring(HASH_CHARS + 1);
}

function parseFilenameFromURL(url: string): string {
  const urlObject = new URL(url, DUMMY_BASE_URL);
  return urlObject.pathname.split('/').pop();
}

export function filterPredicate(
  hashedURL: string,
  potentialMatchURL: string,
): boolean {
  const hashedFilename = parseFilenameFromURL(hashedURL);
  const hashedFilenameOfPotentialMatch =
    parseFilenameFromURL(potentialMatchURL);

  return (
    getOriginalFilename(hashedFilename) ===
    getOriginalFilename(hashedFilenameOfPotentialMatch)
  );
}
