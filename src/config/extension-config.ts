import * as vscode from "vscode";

const CONFIG_ROOT = "yakubuManage";

export interface ExtensionConfig {
  enabled: boolean;
  triggerOnDiagnostics: boolean;
  triggerOnTerminalFailures: boolean;
  onlyOnNewDiagnosticErrors: boolean;
  minIntervalMs: number;
  customPlayCommand: string;
  customSoundPath: string;
}

export class ExtensionConfigProvider implements vscode.Disposable {
  private readonly changeEmitter = new vscode.EventEmitter<ExtensionConfig>();
  private readonly changeSubscription: vscode.Disposable;

  readonly onDidChange = this.changeEmitter.event;

  constructor() {
    this.changeSubscription = vscode.workspace.onDidChangeConfiguration(
      (event) => {
        if (!event.affectsConfiguration(CONFIG_ROOT)) {
          return;
        }

        this.changeEmitter.fire(this.get());
      },
    );
  }

  get(): ExtensionConfig {
    const config = vscode.workspace.getConfiguration(CONFIG_ROOT);

    return {
      enabled: config.get<boolean>("enabled", true),
      triggerOnDiagnostics: config.get<boolean>("triggerOnDiagnostics", true),
      triggerOnTerminalFailures: config.get<boolean>(
        "triggerOnTerminalFailures",
        true,
      ),
      onlyOnNewDiagnosticErrors: config.get<boolean>(
        "onlyOnNewDiagnosticErrors",
        true,
      ),
      minIntervalMs: Math.max(0, config.get<number>("minIntervalMs", 10000)),
      customPlayCommand: (
        config.get<string>("customPlayCommand", "") ?? ""
      ).trim(),
      customSoundPath: (config.get<string>("customSoundPath", "") ?? "").trim(),
    };
  }

  dispose(): void {
    this.changeSubscription.dispose();
    this.changeEmitter.dispose();
  }
}
