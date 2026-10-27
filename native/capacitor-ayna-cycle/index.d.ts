export interface FlowDay {
  /** Local calendar day, YYYY-MM-DD. */
  day: string;
  /** 0 none, 1 unspecified, 2 light, 3 medium, 4 heavy (highest logged that day). */
  value: number;
  /** Bundle id (iOS) or package name (Android) of the app that logged it. */
  sourceId?: string;
}
export interface AynaCyclePlugin {
  isAvailable(): Promise<{ available: boolean; reason?: string }>;
  /**
   * iOS: one HealthKit sheet for menstrual flow (unless includeFlow is false)
   * plus `readTypes` (@capgo/capacitor-health names: sleep, basalBodyTemperature,
   * appleSleepingWristTemperature, restingHeartRate, heartRate,
   * heartRateVariability, steps, calories, workouts). Android ignores the options.
   */
  requestAuthorization(options?: { readTypes?: string[]; includeFlow?: boolean }): Promise<{ asked: boolean; granted: boolean | null }>;
  /** iOS only: would a permission sheet appear for these types? Never says whether reads are allowed. */
  getRequestStatus(options?: { readTypes?: string[]; includeFlow?: boolean }): Promise<{ status: 'shouldRequest' | 'unnecessary' | 'unknown' }>;
  readFlowDays(options: { days: number }): Promise<{ days: FlowDay[] }>;
}
export declare const AynaCycle: AynaCyclePlugin;
