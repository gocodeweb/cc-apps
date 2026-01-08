import { spawn, spawnSync } from "child_process";

export interface TerminalEnvironment {
  inTmux: boolean;
  summary: string;
}

export function detectTerminal(): TerminalEnvironment {
  const inTmux = !!process.env.TMUX;
  const summary = inTmux ? "tmux" : "no tmux";
  return { inTmux, summary };
}

export interface SpawnResult {
  method: string;
  pid?: number;
}

export interface SpawnOptions {
  socketPath?: string;
  scenario?: string;
}

export async function spawnCanvas(
  kind: string,
  id: string,
  configJson?: string,
  options?: SpawnOptions
): Promise<SpawnResult> {
  const env = detectTerminal();

  if (!env.inTmux) {
    throw new Error("Canvas requires tmux. Please run inside a tmux session.");
  }

  // Get the directory of this script (skill directory)
  const scriptDir = import.meta.dir.replace("/src", "");
  const runScript = `${scriptDir}/run-canvas.sh`;

  // Auto-generate socket path for IPC if not provided
  const socketPath = options?.socketPath || `/tmp/canvas-${id}.sock`;

  // Build the command to run
  let command = `${runScript} show ${kind} --id ${id}`;
  if (configJson) {
    // Write config to a temp file to avoid shell escaping issues
    const configFile = `/tmp/canvas-config-${id}.json`;
    await Bun.write(configFile, configJson);
    command += ` --config "$(cat ${configFile})"`;
  }
  command += ` --socket ${socketPath}`;
  if (options?.scenario) {
    command += ` --scenario ${options.scenario}`;
  }

  const result = await spawnTmux(command);
  if (result) return { method: "tmux" };

  throw new Error("Failed to spawn tmux pane");
}

// File to track the canvas pane ID
const CANVAS_PANE_FILE = "/tmp/claude-canvas-pane-id";

async function getCanvasPaneId(): Promise<string | null> {
  try {
    const file = Bun.file(CANVAS_PANE_FILE);
    if (await file.exists()) {
      const paneId = (await file.text()).trim();
      // Verify the pane still exists by checking if tmux can find it
      const result = spawnSync("tmux", ["display-message", "-t", paneId, "-p", "#{pane_id}"]);
      const output = result.stdout?.toString().trim();
      // Pane exists only if command succeeds AND returns the same pane ID
      if (result.status === 0 && output === paneId) {
        return paneId;
      }
      // Stale pane reference - clean up the file
      await Bun.write(CANVAS_PANE_FILE, "");
    }
  } catch {
    // Ignore errors
  }
  return null;
}

async function saveCanvasPaneId(paneId: string): Promise<void> {
  await Bun.write(CANVAS_PANE_FILE, paneId);
}

async function createNewPane(command: string): Promise<boolean> {
  return new Promise((resolve) => {
    // Use split-window -h for vertical split (side by side)
    // -p 50 gives canvas half width (1:1 ratio, Claude:Canvas)
    // -P -F prints the new pane ID so we can save it
    const args = ["split-window", "-h", "-p", "50", "-P", "-F", "#{pane_id}", command];
    const proc = spawn("tmux", args);
    let paneId = "";
    proc.stdout?.on("data", (data) => {
      paneId += data.toString();
    });
    proc.on("close", async (code) => {
      if (code === 0 && paneId.trim()) {
        await saveCanvasPaneId(paneId.trim());
      }
      resolve(code === 0);
    });
    proc.on("error", () => resolve(false));
  });
}

async function reuseExistingPane(paneId: string, command: string): Promise<boolean> {
  return new Promise((resolve) => {
    // Send Ctrl+C to interrupt any running process
    const killProc = spawn("tmux", ["send-keys", "-t", paneId, "C-c"]);
    killProc.on("close", () => {
      // Wait for process to terminate before sending new command
      setTimeout(() => {
        // Clear the terminal and run the new command
        const args = ["send-keys", "-t", paneId, `clear && ${command}`, "Enter"];
        const proc = spawn("tmux", args);
        proc.on("close", (code) => resolve(code === 0));
        proc.on("error", () => resolve(false));
      }, 150);
    });
    killProc.on("error", () => resolve(false));
  });
}

async function spawnTmux(command: string): Promise<boolean> {
  // Check if we have an existing canvas pane to reuse
  const existingPaneId = await getCanvasPaneId();

  if (existingPaneId) {
    // Try to reuse existing pane
    const reused = await reuseExistingPane(existingPaneId, command);
    if (reused) {
      return true;
    }
    // Reuse failed (pane may have been closed) - clear stale reference and create new
    await Bun.write(CANVAS_PANE_FILE, "");
  }

  // Create a new split pane
  return createNewPane(command);
}

export async function spawnBrowser(url: string, options?: { withGui?: boolean }): Promise<SpawnResult> {
  const env = detectTerminal();

  if (!env.inTmux) {
    throw new Error("Browser requires tmux. Please run inside a tmux session.");
  }

  // Kill any existing browsh process first (it doesn't respond to Ctrl+C)
  spawnSync("pkill", ["-f", "browsh"]);

  // Small delay to let the process terminate
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Spawn browsh with the given URL
  const guiFlag = options?.withGui ? " --firefox.with-gui" : "";
  const command = `browsh${guiFlag} --startup-url "${url}"`;
  const result = await spawnTmux(command);

  if (result) {
    // Set pane title with shortcuts
    const paneId = await getCanvasPaneId();
    if (paneId) {
      spawnSync("tmux", [
        "select-pane", "-t", paneId,
        "-T", "^L URL | Bksp Back | Alt+→ Fwd | ^R Reload | ^Q Quit"
      ]);
      // Enable pane border status to show the title
      spawnSync("tmux", ["set-option", "-p", "-t", paneId, "pane-border-status", "bottom"]);
      spawnSync("tmux", ["set-option", "-p", "-t", paneId, "pane-border-format", " #{pane_title} "]);
    }
    return { method: "tmux" };
  }

  throw new Error("Failed to spawn browser pane");
}

