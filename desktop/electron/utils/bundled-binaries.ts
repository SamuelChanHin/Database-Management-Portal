import path from "path";
import { app } from "electron";
import { existsSync } from "fs";

/**
 * Get the path to bundled database CLI tools
 * These are bundled with the app installer so users don't need to install them separately
 */
export function getBundledBinariesPath(): string {
  const isDev = !app.isPackaged;

  if (isDev) {
    // In development, use system-installed binaries
    return "";
  }

  // In production, binaries are bundled in the app
  const platform = process.platform;
  let binariesPath: string;

  if (platform === "darwin") {
    // macOS: binaries are in Contents/Resources/bin
    binariesPath = path.join(process.resourcesPath, "bin");
  } else if (platform === "win32") {
    // Windows: binaries are in resources/bin
    binariesPath = path.join(process.resourcesPath, "bin");
  } else {
    // Linux: binaries are in resources/bin
    binariesPath = path.join(process.resourcesPath, "bin");
  }

  return binariesPath;
}

/**
 * Get the full path to a specific database binary
 */
export function getBinaryPath(binaryName: string): string {
  const binariesPath = getBundledBinariesPath();

  if (!binariesPath) {
    // Development mode - use system binary
    return binaryName;
  }

  // Production mode - use bundled binary
  const platform = process.platform;
  const extension = platform === "win32" ? ".exe" : "";
  const fullPath = path.join(binariesPath, `${binaryName}${extension}`);

  // Fallback to system binary if bundled one doesn't exist
  if (!existsSync(fullPath)) {
    console.warn(
      `Bundled binary not found at ${fullPath}, using system binary`
    );
    return binaryName;
  }

  return fullPath;
}

/**
 * Get environment variables for database binaries
 * On macOS/Linux, we need to set library paths
 */
export function getBinaryEnv(): NodeJS.ProcessEnv {
  const binariesPath = getBundledBinariesPath();

  if (!binariesPath) {
    return process.env;
  }

  const platform = process.platform;
  const libPath = path.join(path.dirname(binariesPath), "lib");

  const env = { ...process.env };

  if (platform === "darwin") {
    env.DYLD_LIBRARY_PATH =
      libPath + (env.DYLD_LIBRARY_PATH ? `:${env.DYLD_LIBRARY_PATH}` : "");
  } else if (platform === "linux") {
    env.LD_LIBRARY_PATH =
      libPath + (env.LD_LIBRARY_PATH ? `:${env.LD_LIBRARY_PATH}` : "");
  }

  return env;
}
