import type { ProcessCommand } from "./process-runner";

const DEFAULT_MAC_SOUND = "/System/Library/Sounds/Glass.aiff";
const DEFAULT_LINUX_SOUNDS = [
  "/usr/share/sounds/freedesktop/stereo/dialog-error.oga",
  "/usr/share/sounds/alsa/Front_Center.wav",
];

export function createDefaultPlayPlan(
  platform: NodeJS.Platform,
  preferredSoundPath: string,
): ProcessCommand[] {
  switch (platform) {
    case "darwin":
      return createMacPlan(preferredSoundPath);

    case "win32":
      return createWindowsPlan(preferredSoundPath);

    case "linux":
      return createLinuxPlan(preferredSoundPath);

    default:
      return [
        {
          command: "sh",
          args: ["-lc", "printf '\\a'"],
        },
      ];
  }
}

function createMacPlan(preferredSoundPath: string): ProcessCommand[] {
  const plan: ProcessCommand[] = [];

  if (preferredSoundPath) {
    plan.push({
      command: "afplay",
      args: [preferredSoundPath],
    });
  }

  plan.push({
    command: "afplay",
    args: [DEFAULT_MAC_SOUND],
  });

  return plan;
}

function createWindowsPlan(preferredSoundPath: string): ProcessCommand[] {
  const plan: ProcessCommand[] = [];

  if (preferredSoundPath) {
    const escapedPath = escapePowerShellSingleQuotedString(preferredSoundPath);

    if (preferredSoundPath.toLowerCase().endsWith(".wav")) {
      plan.push(createWindowsSoundPlayerCommand(escapedPath));
    }

    plan.push(createWindowsPresentationCoreCommand(escapedPath));
    plan.push(createWindowsMediaPlayerCommand(escapedPath));
  }

  return plan;
}

function createWindowsSoundPlayerCommand(escapedPath: string): ProcessCommand {
  return {
    command: "powershell",
    args: [
      "-NoProfile",
      "-Command",
      `(New-Object System.Media.SoundPlayer '${escapedPath}').PlaySync()`,
    ],
  };
}

function createWindowsPresentationCoreCommand(
  escapedPath: string,
): ProcessCommand {
  return {
    command: "powershell",
    args: [
      "-NoProfile",
      "-STA",
      "-Command",
      [
        "Add-Type -AssemblyName PresentationCore",
        "$player = New-Object System.Windows.Media.MediaPlayer",
        `$player.Open([Uri]::new('${escapedPath}'))`,
        "$deadline = [DateTime]::UtcNow.AddSeconds(5)",
        "while ((-not $player.NaturalDuration.HasTimeSpan) -and [DateTime]::UtcNow -lt $deadline) { Start-Sleep -Milliseconds 100 }",
        "if (-not $player.NaturalDuration.HasTimeSpan) { $player.Close(); exit 1 }",
        "$player.Play()",
        "$playbackMs = [Math]::Max(1000, [Math]::Ceiling($player.NaturalDuration.TimeSpan.TotalMilliseconds) + 250)",
        "Start-Sleep -Milliseconds $playbackMs",
        "$player.Close()",
      ].join("; "),
    ],
  };
}

function createWindowsMediaPlayerCommand(escapedPath: string): ProcessCommand {
  return {
    command: "powershell",
    args: [
      "-NoProfile",
      "-Command",
      [
        "$player = New-Object -ComObject WMPlayer.OCX",
        "$player.settings.autoStart = $false",
        `$player.URL = '${escapedPath}'`,
        "$player.controls.play()",
        "$deadline = [DateTime]::UtcNow.AddSeconds(5)",
        "while ((-not $player.currentMedia -or $player.currentMedia.duration -le 0) -and [DateTime]::UtcNow -lt $deadline) { Start-Sleep -Milliseconds 100 }",
        "if (-not $player.currentMedia -or $player.currentMedia.duration -le 0) { $player.close(); exit 1 }",
        "$playbackMs = [Math]::Max(1000, [Math]::Ceiling($player.currentMedia.duration * 1000) + 250)",
        "Start-Sleep -Milliseconds $playbackMs",
        "$player.close()",
      ].join("; "),
    ],
  };
}

function escapePowerShellSingleQuotedString(value: string): string {
  return value.replace(/'/g, "''");
}

function createLinuxPlan(preferredSoundPath: string): ProcessCommand[] {
  const plan: ProcessCommand[] = [];

  if (preferredSoundPath) {
    plan.push(
      {
        command: "paplay",
        args: [preferredSoundPath],
      },
      {
        command: "aplay",
        args: [preferredSoundPath],
      },
    );
  }

  plan.push(
    {
      command: "paplay",
      args: [DEFAULT_LINUX_SOUNDS[0]],
    },
    {
      command: "aplay",
      args: [DEFAULT_LINUX_SOUNDS[1]],
    },
    {
      command: "sh",
      args: ["-lc", "printf '\\a'"],
    },
  );

  return plan;
}
