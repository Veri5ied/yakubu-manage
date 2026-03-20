import { spawn } from "child_process";

export interface ProcessCommand {
  command: string;
  args?: string[];
  shell?: boolean;
}

export async function runProcess(command: ProcessCommand): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command.command, command.args ?? [], {
      shell: command.shell ?? false,
      stdio: "ignore",
      windowsHide: true,
    });

    child.once("error", (error) => {
      reject(error);
    });

    child.once("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `Command "${command.command}" exited with code ${code ?? "unknown"}.`,
        ),
      );
    });
  });
}
