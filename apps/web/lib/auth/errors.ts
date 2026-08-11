export function formMessage(message: string) {
  return encodeURIComponent(message);
}

export function friendlyAuthErrorMessage(error: unknown) {
  const fallback =
    "Authentication service is unavailable. Check the Supabase URL and anon key for this environment.";

  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message;
  const lowerMessage = message.toLowerCase();

  if (
    message.includes("Unexpected token") ||
    message.includes("not valid JSON") ||
    lowerMessage.includes("the page") ||
    lowerMessage.includes("syntaxerror")
  ) {
    return fallback;
  }

  return message;
}
