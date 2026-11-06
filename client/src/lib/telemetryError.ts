export function telemetryErrorMessage(code?: string): string {
  if (code === "UNAUTHORIZED") {
    return "Your CMS session has expired or is unavailable. Recheck your CMS session and sign in again to load live telemetry.";
  }
  if (code === "INTERNAL_SERVER_ERROR") {
    return "Live telemetry could not be loaded from the database. Try REFRESH. No sample or zero counts are being substituted.";
  }
  return "Live telemetry could not be loaded. Check your connection and try REFRESH. No sample or zero counts are being substituted.";
}
