/** Stable, non-cryptographic identifiers for mock/demo adapter responses. */
export function syntheticToken(value: string, length = 8): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619) >>> 0;
  }
  return hash.toString(36).toUpperCase().padStart(length, "0").slice(0, length);
}

export function syntheticDigits(value: string, length = 6): string {
  const range = 10 ** length;
  const minimum = 10 ** (length - 1);
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619) >>> 0;
  }
  return String((hash % (range - minimum)) + minimum);
}
