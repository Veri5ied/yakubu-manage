import * as vscode from "vscode";

import type { Logger } from "./logger";

type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

export class OutputChannelLogger implements Logger, vscode.Disposable {
  private readonly channel: vscode.OutputChannel;

  constructor(channelName: string) {
    this.channel = vscode.window.createOutputChannel(channelName);
  }

  debug(message: string): void {
    this.log("DEBUG", message);
  }

  info(message: string): void {
    this.log("INFO", message);
  }

  warn(message: string): void {
    this.log("WARN", message);
  }

  error(message: string, error?: unknown): void {
    const suffix = error === undefined ? "" : ` | ${this.describeError(error)}`;
    this.log("ERROR", `${message}${suffix}`);
  }

  dispose(): void {
    this.channel.dispose();
  }

  private log(level: LogLevel, message: string): void {
    const timestamp = new Date().toISOString();
    this.channel.appendLine(`[${timestamp}] [${level}] ${message}`);
  }

  private describeError(error: unknown): string {
    if (error instanceof Error) {
      return `${error.name}: ${error.message}`;
    }

    if (typeof error === "string") {
      return error;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return "Unknown error";
    }
  }
}
