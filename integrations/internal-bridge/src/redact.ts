const secretPatterns = [/password/i, /secret/i, /token/i, /credential/i, /key/i];

export function redact(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redact(item));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      secretPatterns.some((pattern) => pattern.test(key)) ? "[REDACTED]" : redact(child),
    ]),
  );
}
