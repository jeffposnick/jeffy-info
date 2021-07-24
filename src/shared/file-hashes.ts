import { createHash } from 'crypto';
import fse from 'fs-extra';
import path from 'path';

const DUMMY_BASE_URL = 'https://example.com/';
const HASH_CHARS = 8;

export async function getHash(pathToFile: string): Promise<string> {
  const contents = await fse.readFile(pathToFile);

  const hash = createHash('sha256');
  hash.update(contents);
  return hash.digest('base64url').toString().substring(0, HASH_CHARS);
}

export function getHashedFilename(pathToFile: string, hash: string) {
  const { dir, base } = path.parse(pathToFile);
  return path.format({ dir, base: `_${hash}_${base}` });
}

export function getOriginalFilename(hashedFilename: string): string {
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
