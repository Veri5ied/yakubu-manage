export class CooldownGate {
  private lastTriggerAt = 0;

  tryTake(minIntervalMs: number, now = Date.now()): boolean {
    if (now - this.lastTriggerAt < minIntervalMs) {
      return false;
    }

    this.lastTriggerAt = now;
    return true;
  }

  reset(): void {
    this.lastTriggerAt = 0;
  }
}
