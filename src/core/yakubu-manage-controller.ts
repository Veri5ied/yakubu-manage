import * as vscode from "vscode";

import type {
  ExtensionConfig,
  ExtensionConfigProvider,
} from "../config/extension-config";
import type { Logger } from "../logging/logger";
import type { SoundPlayer } from "../sound/sound-player";
import type { ErrorTriggerEvent } from "../types";
import { CooldownGate } from "./cooldown-gate";
import { MuteStateStore } from "./mute-state-store";

interface YakubuManageControllerDependencies {
  context: vscode.ExtensionContext;
  configProvider: ExtensionConfigProvider;
  logger: Logger;
  soundPlayer: SoundPlayer;
  bundledSoundPath: string;
  ramiSoundPath: string;
}

interface PlayOptions {
  ignoreCooldown: boolean;
  ignoreMute: boolean;
}

export class YakubuManageController implements vscode.Disposable {
  private readonly muteStateStore: MuteStateStore;
  private readonly cooldownGate = new CooldownGate();
  private readonly configSubscription: vscode.Disposable;

  private config: ExtensionConfig;

  constructor(
    private readonly dependencies: YakubuManageControllerDependencies,
  ) {
    this.muteStateStore = new MuteStateStore(dependencies.context);
    this.config = dependencies.configProvider.get();
    this.configSubscription = dependencies.configProvider.onDidChange(
      (nextConfig) => {
        this.config = nextConfig;
        this.dependencies.logger.info("Configuration updated.");
      },
    );
  }

  isMuted(): boolean {
    return this.muteStateStore.get();
  }

  async toggleMute(): Promise<boolean> {
    const muted = await this.muteStateStore.toggle();
    this.dependencies.logger.info(muted ? "Muted." : "Unmuted.");
    return muted;
  }

  async trigger(event: ErrorTriggerEvent): Promise<boolean> {
    return this.play(event, { ignoreCooldown: false, ignoreMute: false });
  }

  async playTestSound(): Promise<boolean> {
    return this.play(
      {
        source: "manual",
        message: "Manual test playback.",
      },
      { ignoreCooldown: true, ignoreMute: true },
    );
  }

  dispose(): void {
    this.configSubscription.dispose();
  }

  private pickSoundPath(event: ErrorTriggerEvent): string | undefined {
    // User-configured custom sound always takes priority.
    if (this.config.customSoundPath) {
      return undefined;
    }

    const useRami =
      event.severity === "high" ||
      event.source === "terminal";

    if (useRami) {
      return this.dependencies.ramiSoundPath;
    }

    // Normal severity: pick randomly between the two bundled tracks.
    return Math.random() < 0.5
      ? this.dependencies.bundledSoundPath
      : this.dependencies.ramiSoundPath;
  }

  private async play(
    event: ErrorTriggerEvent,
    options: PlayOptions,
  ): Promise<boolean> {
    if (!this.config.enabled && event.source !== "manual") {
      this.dependencies.logger.debug(
        `Skipped ${event.source} trigger: extension disabled.`,
      );
      return false;
    }

    if (!options.ignoreMute && this.muteStateStore.get()) {
      this.dependencies.logger.debug(`Skipped ${event.source} trigger: muted.`);
      return false;
    }

    if (
      !options.ignoreCooldown &&
      !this.cooldownGate.tryTake(this.config.minIntervalMs)
    ) {
      this.dependencies.logger.debug(
        `Skipped ${event.source} trigger: cooldown active.`,
      );
      return false;
    }

    try {
      const overrideSoundPath = this.pickSoundPath(event);
      await this.dependencies.soundPlayer.play({
        customPlayCommand: this.config.customPlayCommand,
        customSoundPath: this.config.customSoundPath,
        bundledSoundPath: this.dependencies.bundledSoundPath,
        overrideSoundPath,
      });
      this.dependencies.logger.info(
        `Played sound for ${event.source}. ${event.message}`,
      );
      return true;
    } catch (error) {
      this.dependencies.logger.error(
        `Failed to play sound for ${event.source}.`,
        error,
      );
      return false;
    }
  }
}
