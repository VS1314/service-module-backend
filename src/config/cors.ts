export function parseCorsOrigins(value: string): string[] {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function isCorsOriginAllowed(
  requestOrigin: string | undefined,
  configuredOrigins: string,
): boolean {
  if (!requestOrigin) {
    return true;
  }

  return parseCorsOrigins(configuredOrigins).includes(requestOrigin);
}
