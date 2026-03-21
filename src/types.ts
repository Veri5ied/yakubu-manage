export type ErrorSource = "diagnostic" | "terminal" | "manual";

export type ErrorSeverity = "normal" | "high";

export interface ErrorTriggerEvent {
  source: ErrorSource;
  message: string;
  severity?: ErrorSeverity;
}
