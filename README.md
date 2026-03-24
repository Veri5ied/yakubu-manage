# Yakubu Manage

Yakubu Manage is a VS Code extension that plays your Yakubu Manage sound when:

- editor diagnostics introduce errors
- integrated terminal commands exit with a non-zero status

It is intentionally configurable so it can stay useful instead of noisy.

## Features

- Diagnostic-based trigger using `onDidChangeDiagnostics`
- Terminal failure trigger using `onDidEndTerminalShellExecution`
- Cooldown protection (`yakubuManage.minIntervalMs`)
- Mute toggle command (`Yakubu Manage: Toggle Mute`)
- Manual test command (`Yakubu Manage: Play Test Sound`)
- Cross-platform default playback with optional custom command override
- Bundled default sound asset at `assets/yakubu-manage.mp3`
- Windows built-in playback for the bundled `assets/yakubu-manage.mp3` sound

## Configuration

Open VS Code settings and search for `Yakubu Manage`.

- `yakubuManage.enabled`: master switch
- `yakubuManage.triggerOnDiagnostics`: enable/disable diagnostics trigger
- `yakubuManage.triggerOnTerminalFailures`: enable/disable terminal trigger
- `yakubuManage.onlyOnNewDiagnosticErrors`: only play when error count increases
- `yakubuManage.minIntervalMs`: minimum milliseconds between plays
- `yakubuManage.customPlayCommand`: full shell command to play sound
- `yakubuManage.customSoundPath`: sound file path for built-in platform command

By default, the extension plays the bundled `assets/yakubu-manage.mp3`.  
If you set `yakubuManage.customSoundPath`, that path is used instead.
On Windows, built-in playback works best with `.wav` or `.mp3` files and does not fall back to a console beep.

### Example custom command

```bash
afplay "/Users/you/sounds/yakubu-manage.wav"
```

Set that in `yakubuManage.customPlayCommand` to force your own playback behavior.

## Development

```bash
npm install
npm run compile
```

Then press `F5` in VS Code to run the extension in an Extension Development Host window.

## Notes

- Terminal failure detection depends on VS Code shell integration support.
- If no suitable system playback command exists on your machine, use `yakubuManage.customPlayCommand`.
