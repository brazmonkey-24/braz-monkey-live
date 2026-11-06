import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { telemetryErrorMessage } from "../client/src/lib/telemetryError";

describe("safe live telemetry failure handling", () => {
  it("distinguishes CMS expiry from database and network errors", () => {
    expect(telemetryErrorMessage("UNAUTHORIZED")).toContain("CMS session has expired");
    expect(telemetryErrorMessage("UNAUTHORIZED")).not.toContain("database");
    expect(telemetryErrorMessage("INTERNAL_SERVER_ERROR")).toContain("from the database");
    expect(telemetryErrorMessage()).toContain("Check your connection");
  });
  it("never substitutes sample counts or exposes sensitive diagnostics", () => {
    for (const code of ["INTERNAL_SERVER_ERROR", "UNKNOWN", undefined]) {
      const text = telemetryErrorMessage(code);
      expect(text).toContain("No sample or zero counts are being substituted");
      expect(text).not.toMatch(/SQL|SELECT|password|JWT|DATABASE_URL|token/);
    }
  });
  it("rechecks only the existing CMS session and still hides stale metrics", () => {
    const component = readFileSync(new URL("../client/src/components/SignalAnalytics.tsx", import.meta.url), "utf8");
    expect(component).toContain('query.error?.data?.code === "UNAUTHORIZED"');
    expect(component).toContain("utils.admin.session.invalidate()");
    expect(component).toContain("!query.isError && data");
    expect(component).toContain("useMemo(() => ({ days }), [days])");
    expect(component).not.toContain("startLogin");
  });
});
