const MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/invalid-credentials": "Incorrect email or password.",
  "auth/user-not-found": "No account found with this email.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Choose a stronger password (at least 6 characters).",
  "auth/too-many-requests": "Too many attempts. Try again in a few minutes.",
  "auth/user-disabled": "This account is disabled. Contact support if you think this is a mistake.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
  "permission-denied": "You don't have permission to do that.",
  unavailable: "The service is temporarily unavailable. Try again shortly.",
}

/** Maps a Firebase error to a message safe to show users. Never exposes raw errors. */
export function friendlyFirebaseError(error: unknown, fallback = "Something went wrong. Try again."): string {
  const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code: unknown }).code) : ""
  return MESSAGES[code] ?? MESSAGES[code.replace(/^firestore\//, "")] ?? fallback
}
