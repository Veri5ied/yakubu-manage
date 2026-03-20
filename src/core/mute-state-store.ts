import * as vscode from "vscode";

const MUTE_STATE_KEY = "yakubu-manage.is-muted";

export class MuteStateStore {
  constructor(private readonly context: vscode.ExtensionContext) {}

  get(): boolean {
    return this.context.globalState.get<boolean>(MUTE_STATE_KEY, false);
  }

  async set(value: boolean): Promise<void> {
    await this.context.globalState.update(MUTE_STATE_KEY, value);
  }

  async toggle(): Promise<boolean> {
    const next = !this.get();
    await this.set(next);
    return next;
  }
}
