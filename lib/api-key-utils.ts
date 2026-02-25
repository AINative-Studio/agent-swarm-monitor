/**
 * Utility functions for API key management
 */

/**
 * Masks an API key for display purposes
 * Shows first 3 and last 4 characters, masks the rest
 * @param key - The API key to mask
 * @returns Masked version of the key (e.g., "sk-...abc123")
 */
export function maskApiKey(key: string): string {
  if (!key || key.length <= 7) {
    return '***';
  }
  return `${key.slice(0, 3)}...${key.slice(-4)}`;
}

/**
 * Validates if a string looks like a valid API key
 * Basic validation - just checks if it's not empty and has reasonable length
 * @param key - The API key to validate
 * @returns True if the key appears valid
 */
export function isValidApiKey(key: string): boolean {
  return key.trim().length >= 8;
}
