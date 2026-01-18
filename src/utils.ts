/**
 * Build a full URL based on the base URL convar and the provided path.
 * @param path The path to append to the base URL.
 * @returns The full URL as a string.
 */
export function buildURL(path: string): string {
  const baseUrl = GetConvar("web_baseUrl", "");
  return `https://${baseUrl}/${path}`;
}
