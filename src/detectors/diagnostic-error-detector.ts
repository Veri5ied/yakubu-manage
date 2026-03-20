import * as vscode from "vscode";

import type { ExtensionConfigProvider } from "../config/extension-config";
import type { YakubuManageController } from "../core/yakubu-manage-controller";
import type { Logger } from "../logging/logger";

export class DiagnosticErrorDetector implements vscode.Disposable {
  private readonly diagnosticsSubscription: vscode.Disposable;
  private readonly knownErrorCountByDocument = new Map<string, number>();

  constructor(
    private readonly controller: YakubuManageController,
    private readonly configProvider: ExtensionConfigProvider,
    private readonly logger: Logger,
  ) {
    this.seedKnownDiagnostics();
    this.diagnosticsSubscription = vscode.languages.onDidChangeDiagnostics(
      (event) => {
        void this.onDiagnosticsChanged(event);
      },
    );
  }

  dispose(): void {
    this.diagnosticsSubscription.dispose();
  }

  private async onDiagnosticsChanged(
    event: vscode.DiagnosticChangeEvent,
  ): Promise<void> {
    const config = this.configProvider.get();
    if (!config.enabled || !config.triggerOnDiagnostics) {
      return;
    }

    let shouldTrigger = false;

    for (const uri of event.uris) {
      const key = uri.toString();
      const previousCount = this.knownErrorCountByDocument.get(key) ?? 0;
      const nextCount = countErrors(vscode.languages.getDiagnostics(uri));

      if (nextCount > 0) {
        this.knownErrorCountByDocument.set(key, nextCount);
      } else {
        this.knownErrorCountByDocument.delete(key);
      }

      if (config.onlyOnNewDiagnosticErrors) {
        if (nextCount > previousCount) {
          shouldTrigger = true;
        }
      } else if (nextCount > 0) {
        shouldTrigger = true;
      }
    }

    if (!shouldTrigger) {
      return;
    }

    const played = await this.controller.trigger({
      source: "diagnostic",
      message: "Diagnostics introduced an error.",
    });

    if (!played) {
      this.logger.debug("Diagnostic trigger attempted but no sound played.");
    }
  }

  private seedKnownDiagnostics(): void {
    for (const [uri, diagnostics] of vscode.languages.getDiagnostics()) {
      const errorCount = countErrors(diagnostics);
      if (errorCount > 0) {
        this.knownErrorCountByDocument.set(uri.toString(), errorCount);
      }
    }
  }
}

function countErrors(diagnostics: readonly vscode.Diagnostic[]): number {
  return diagnostics.filter(
    (diagnostic) => diagnostic.severity === vscode.DiagnosticSeverity.Error,
  ).length;
}
