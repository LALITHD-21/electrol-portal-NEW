/**
 * Dashboard snapshot refresh helper.
 *
 * The unfiltered analytics dashboard is served from the single-row
 * `dashboard_snapshot` table for speed. Any write to `electors` must
 * refresh that snapshot so charts update in real time.
 *
 * - Never throws (a failed refresh must not fail the user's write).
 * - De-duplicates concurrent refreshes within this server instance.
 * - Never logs PII.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseLike = { rpc: (fn: string, args?: Record<string, unknown>) => any };

let inFlight: Promise<boolean> | null = null;
let lastRefreshAt = 0;

export function getLastSnapshotRefreshAt() {
  return lastRefreshAt;
}

export async function refreshDashboardSnapshot(supabase: SupabaseLike): Promise<boolean> {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const { error } = await supabase.rpc('refresh_dashboard_snapshot');
      if (error) {
        console.error('Dashboard snapshot refresh failed:', error.message);
        return false;
      }
      lastRefreshAt = Date.now();
      return true;
    } catch (err) {
      console.error(
        'Dashboard snapshot refresh exception:',
        err instanceof Error ? err.message : 'unknown error'
      );
      return false;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
