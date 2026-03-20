export type ErrorSource = "diagnostic" | "terminal" | "manual";

export interface ErrorTriggerEvent {
  source: ErrorSource;
  message: string;
}
