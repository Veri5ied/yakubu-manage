import * as vscode from "vscode";

import type { ExtensionConfigProvider } from "../config/extension-config";
import type { YakubuManageController } from "../core/yakubu-manage-controller";
import type { Logger } from "../logging/logger";

interface TerminalShellExecutionEndEventLike {
  exitCode?: number;
  execution?: {
    commandLine?: unknown;
  };
}

interface ShellExecutionEventApi {
  onDidEndTerminalShellExecution?: (
    listener: (event: TerminalShellExecutionEndEventLike) => unknown,
  ) => vscode.Disposable;
}

export class TerminalErrorDetector implements vscode.Disposable {
  private readonly terminalSubscription: vscode.Disposable;

  constructor(
    private readonly controller: YakubuManageController,
    private readonly configProvider: ExtensionConfigProvider,
    private readonly logger: Logger,
  ) {
    const windowApi = vscode.window as unknown as ShellExecutionEventApi;
    if (!windowApi.onDidEndTerminalShellExecution) {
      this.logger.warn(
        "Terminal shell execution API is unavailable in this VS Code build. Terminal failure trigger disabled.",
      );
      this.terminalSubscription = new vscode.Disposable(() => undefined);
      return;
    }

    this.terminalSubscription = windowApi.onDidEndTerminalShellExecution(
      (event) => {
        void this.onTerminalExecutionEnd(event);
      },
    );
  }

  dispose(): void {
    this.terminalSubscription.dispose();
  }

  private async onTerminalExecutionEnd(
    event: TerminalShellExecutionEndEventLike,
  ): Promise<void> {
    const config = this.configProvider.get();
    if (!config.enabled || !config.triggerOnTerminalFailures) {
      return;
    }

    const exitCode =
      typeof event.exitCode === "number" ? event.exitCode : undefined;
    if (exitCode === undefined || exitCode === 0) {
      return;
    }

    const commandLine = parseCommandLine(event.execution?.commandLine);
    const message = commandLine
      ? `Terminal command failed (exit ${exitCode}): ${commandLine}`
      : `Terminal command failed (exit ${exitCode}).`;

    const played = await this.controller.trigger({
      source: "terminal",
      message,
      severity: "high",
    });

    if (!played) {
      this.logger.debug("Terminal trigger attempted but no sound played.");
    }
  }
}

function parseCommandLine(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (
    value !== null &&
    typeof value === "object" &&
    "value" in value &&
    typeof (value as { value?: unknown }).value === "string"
  ) {
    return (value as { value: string }).value;
  }

  return "";
}
