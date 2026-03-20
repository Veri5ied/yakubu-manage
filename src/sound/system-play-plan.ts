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
    const escapedPath = preferredSoundPath.replace(/'/g, "''");
    plan.push({
      command: "powershell",
      args: [
        "-NoProfile",
        "-Command",
        `(New-Object Media.SoundPlayer '${escapedPath}').PlaySync()`,
      ],
    });
  }

  plan.push({
    command: "powershell",
    args: ["-NoProfile", "-Command", "[console]::beep(1100,250)"],
  });

  return plan;
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
