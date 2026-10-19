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
  requestAuthorization(): Promise<{ asked: boolean; granted: boolean | null }>;
  readFlowDays(options: { days: number }): Promise<{ days: FlowDay[] }>;
}
export declare const AynaCycle: AynaCyclePlugin;
