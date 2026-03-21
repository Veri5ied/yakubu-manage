import * as vscode from "vscode";

import { ExtensionConfigProvider } from "./config/extension-config";
import { YakubuManageController } from "./core/yakubu-manage-controller";
import { DiagnosticErrorDetector } from "./detectors/diagnostic-error-detector";
import { TerminalErrorDetector } from "./detectors/terminal-error-detector";
import { OutputChannelLogger } from "./logging/output-channel-logger";
import { ShellCommandSoundPlayer } from "./sound/sound-player";

const PLAY_TEST_SOUND_COMMAND = "yakubu-manage.play-test-sound";
const TOGGLE_MUTE_COMMAND = "yakubu-manage.toggle-mute";

export function activate(context: vscode.ExtensionContext): void {
  const logger = new OutputChannelLogger("Yakubu Manage");
  const configProvider = new ExtensionConfigProvider();
  const soundPlayer = new ShellCommandSoundPlayer(logger);
  const bundledSoundPath = vscode.Uri.joinPath(
    context.extensionUri,
    "assets",
    "yakubu-manage.mp3",
  ).fsPath;

  const ramiSoundPath = vscode.Uri.joinPath(
    context.extensionUri,
    "assets",
    "Rami lo wo.mp3",
  ).fsPath;

  const controller = new YakubuManageController({
    context,
    configProvider,
    logger,
    soundPlayer,
    bundledSoundPath,
    ramiSoundPath,
  });

  const diagnosticDetector = new DiagnosticErrorDetector(
    controller,
    configProvider,
    logger,
  );
  const terminalDetector = new TerminalErrorDetector(
    controller,
    configProvider,
    logger,
  );

  context.subscriptions.push(
    logger,
    configProvider,
    controller,
    diagnosticDetector,
    terminalDetector,
    vscode.commands.registerCommand(PLAY_TEST_SOUND_COMMAND, async () => {
      const played = await controller.playTestSound();
      if (!played) {
        void vscode.window.showWarningMessage(
          "Yakubu Manage could not play the test sound. Open the output channel for details.",
        );
        return;
      }

      void vscode.window.setStatusBarMessage(
        "Yakubu Manage test sound played.",
        2500,
      );
    }),
    vscode.commands.registerCommand(TOGGLE_MUTE_COMMAND, async () => {
      const muted = await controller.toggleMute();
      void vscode.window.setStatusBarMessage(
        muted ? "Yakubu Manage muted." : "Yakubu Manage unmuted.",
        2500,
      );
    }),
  );

  logger.info("Extension activated.");
}

export function deactivate(): void {}
