import type { Logger } from "../logging/logger";
import { runProcess } from "./process-runner";
import { createDefaultPlayPlan } from "./system-play-plan";

export interface SoundPlaybackConfig {
  customPlayCommand: string;
  customSoundPath: string;
  bundledSoundPath: string;
  /** When set, overrides customSoundPath and bundledSoundPath. */
  overrideSoundPath?: string;
}

export interface SoundPlayer {
  play(config: SoundPlaybackConfig): Promise<void>;
}

export class ShellCommandSoundPlayer implements SoundPlayer {
  constructor(private readonly logger: Logger) {}

  async play(config: SoundPlaybackConfig): Promise<void> {
    if (config.customPlayCommand) {
      this.logger.debug("Playing sound using custom command.");
      await runProcess({
        command: config.customPlayCommand,
        shell: true,
      });
      return;
    }

    const soundPath =
      config.overrideSoundPath ||
      config.customSoundPath ||
      config.bundledSoundPath;
    const playPlan = createDefaultPlayPlan(process.platform, soundPath);
    let lastError: unknown;

    for (const step of playPlan) {
      try {
        await runProcess(step);
        return;
      } catch (error) {
        lastError = error;
        this.logger.debug(
          `Playback command failed: ${step.command} ${step.args?.join(" ") ?? ""}`.trim(),
        );
      }
    }

    if (lastError instanceof Error) {
      throw new Error(`Unable to play sound. ${lastError.message}`);
    }

    throw new Error(
      "Unable to play sound with all available playback commands.",
    );
  }
}
