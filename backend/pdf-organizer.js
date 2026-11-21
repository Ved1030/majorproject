/**
 * PDF Organize module
 * Reorders, rotates and deletes pages from one PDF using the pypdf-based
 * Python processor (backend/pdf_organizer.py).
 *
 * Processing logic is kept separate from the Express route handler.
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { v4: uuidv4 } = require("uuid");
const {
  ConversionError,
  ERROR_CODES,
  FILE_SIZE_LIMITS,
} = require("./converters/types");

const PDF_ORGANIZER_SCRIPT = path.join(__dirname, "pdf_organizer.py");
const MAX_FILE_SIZE = FILE_SIZE_LIMITS.pdf || 50 * 1024 * 1024;
const PDF_SIGNATURE = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-

class PdfOrganizer {
  constructor() {
    this.tempDir = path.join(__dirname, "temp");
    this.ensureTempDir();
  }

  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  cleanupTempFiles(...pathsToClean) {
    for (const filePath of pathsToClean) {
      try {
        if (filePath && fs.existsSync(filePath)) {
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            fs.rmSync(filePath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(filePath);
          }
        }
      } catch (err) {
        console.warn(`[PdfOrganizer] Failed to cleanup temp file ${filePath}:`, err.message);
      }
    }
  }

  getPythonBin() {
    const venvPythonWin = path.join(__dirname, ".venv", "Scripts", "python.exe");
    if (fs.existsSync(venvPythonWin)) return venvPythonWin;
    const venvPython = path.join(__dirname, ".venv", "bin", "python");
    if (fs.existsSync(venvPython)) return venvPython;
    return process.platform === "win32" ? "python" : "python3";
  }

  async runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      const spawnOptions = {
        env: { ...process.env, PYTHONUNBUFFERED: "1", PYTHONIOENCODING: "utf-8" },
        cwd: options.cwd || process.cwd(),
        timeout: options.timeout || 300000,
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      };
      if (process.platform === "win32") {
        spawnOptions.windowsVerbatimArguments = false;
      }

      const proc = spawn(command, args, spawnOptions);
      let stdout = "";
      let stderr = "";

      proc.stdout.on("data", (d) => (stdout += d.toString()));
      proc.stderr.on("data", (d) => (stderr += d.toString()));

      proc.on("close", (code, signal) => {
        if (code !== 0) {
          const timedOut = signal === "SIGTERM" || code === null;
          reject(new ConversionError(
            timedOut
              ? "PDF organization timed out"
              : `PDF organize process failed with code ${code}: ${stderr}`,
            timedOut ? ERROR_CODES.TIMEOUT : ERROR_CODES.CONVERSION_FAILED,
            { command, code, signal, stderr: stderr.substring(0, 500) },
          ));
          return;
        }
        resolve({ stdout, stderr, code });
      });

      proc.on("error", (err) => {
        reject(new ConversionError(
          `Failed to spawn PDF organize process: ${err.message}`,
          ERROR_CODES.CONVERSION_FAILED,
          { command, error: err.message },
        ));
      });
    });
  }

  lastJsonLine(text) {
    const lines = text.trim().split(/\r?\n/);
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (!line.startsWith("{")) continue;
      try {
        return JSON.parse(line);
      } catch {
        // keep scanning towards the start
      }
    }
    return null;
  }

  isPdfSignature(buffer) {
    return buffer.length >= 5 && buffer.slice(0, 5).equals(PDF_SIGNATURE);
  }

  validateConfig(config) {
    if (!config || !Array.isArray(config.pages) || config.pages.length === 0) {
      throw new ConversionError(
        "At least one page must remain in the PDF.",
        ERROR_CODES.INVALID_INPUT,
      );
    }

    const seen = new Set();
    for (let i = 0; i < config.pages.length; i++) {
      const entry = config.pages[i];
      if (!entry || typeof entry !== "object") {
        throw new ConversionError(
          `Page entry ${i + 1} is invalid.`,
          ERROR_CODES.INVALID_INPUT,
        );
      }
      if (!Number.isInteger(entry.originalPage) || entry.originalPage < 0) {
        throw new ConversionError(
          `Page entry ${i + 1} has an invalid original page index.`,
          ERROR_CODES.INVALID_INPUT,
        );
      }
      if (![0, 90, 180, 270].includes(entry.rotation)) {
        throw new ConversionError(
          `Page entry ${i + 1} has an invalid rotation.`,
          ERROR_CODES.INVALID_INPUT,
        );
      }
      if (seen.has(entry.originalPage)) {
        throw new ConversionError(
          `Original page ${entry.originalPage + 1} appears more than once.`,
          ERROR_CODES.INVALID_INPUT,
        );
      }
      seen.add(entry.originalPage);
    }
  }

  safeOutputName(originalName) {
    const base = (originalName || "document")
      .replace(/\.pdf$/i, "")
      .replace(/[\r\n"\\/]/g, "_")
      .trim()
      .slice(0, 160);
    return `${base || "document"}_organized.pdf`;
  }

  /**
   * Organize an uploaded PDF.
   * @param {{buffer: Buffer, originalName: string, size: number}} file
   * @param {{pages: Array<{originalPage: number, rotation: number}>}} config
   * @returns {Promise<{buffer: Buffer, filename: string, stats: Object}>}
   */
  async organize(file, config) {
    const { buffer, originalName } = file;

    if (!buffer || buffer.length === 0) {
      throw new ConversionError(
        "Empty file uploaded",
        ERROR_CODES.EMPTY_FILE,
        { file: originalName },
      );
    }

    if (buffer.length > MAX_FILE_SIZE) {
      throw new ConversionError(
        `File too large: ${originalName}`,
        ERROR_CODES.FILE_TOO_LARGE,
        { file: originalName, size: buffer.length, maxSize: MAX_FILE_SIZE },
      );
    }

    // Never rely only on the extension; verify the content is a PDF.
    if (!this.isPdfSignature(buffer)) {
      throw new ConversionError(
        `File is not a valid PDF: ${originalName}`,
        ERROR_CODES.INVALID_INPUT,
        { file: originalName },
      );
    }

    this.validateConfig(config);

    // Unique temp directory per request so concurrent calls never collide.
    const requestId = uuidv4();
    const workDir = path.join(this.tempDir, `organize_${requestId}`);
    fs.mkdirSync(workDir, { recursive: true });

    const inputPath = path.join(workDir, `${uuidv4()}.pdf`);
    const requestPath = path.join(workDir, "request.request");
    const outputPath = path.join(workDir, "organized.pdf");

    try {
      fs.writeFileSync(inputPath, buffer);
      fs.writeFileSync(requestPath, JSON.stringify({ pages: config.pages }), "utf8");

      const pythonBin = this.getPythonBin();
      const check = await this.runCommand(
        pythonBin,
        [PDF_ORGANIZER_SCRIPT, "--check"],
        { timeout: 30000 },
      );
      const checkResult = this.lastJsonLine(check.stdout);
      if (!checkResult || !checkResult.success) {
        throw new ConversionError(
          "PDF organize service unavailable",
          ERROR_CODES.MISSING_DEPENDENCY,
          { detail: checkResult && checkResult.error },
        );
      }

      const organizeResult = await this.runCommand(
        pythonBin,
        [PDF_ORGANIZER_SCRIPT, outputPath, inputPath, requestPath],
        { timeout: 300000 },
      );

      const parsed = this.lastJsonLine(organizeResult.stdout);
      if (!parsed || !parsed.success) {
        throw new ConversionError(
          parsed && parsed.error ? parsed.error : "PDF organization failed",
          parsed && parsed.code ? parsed.code : ERROR_CODES.CONVERSION_FAILED,
          { detail: parsed },
        );
      }

      if (!fs.existsSync(outputPath)) {
        throw new ConversionError(
          "Organized output file was not created",
          ERROR_CODES.CONVERSION_FAILED,
        );
      }

      const outputBuffer = fs.readFileSync(outputPath);
      if (outputBuffer.length === 0) {
        throw new ConversionError(
          "PDF organization produced an empty output",
          ERROR_CODES.CONVERSION_FAILED,
        );
      }

      return {
        buffer: outputBuffer,
        filename: this.safeOutputName(originalName),
        stats: {
          inputPages: parsed.input_pages || config.pages.length,
          pageCount: parsed.page_count || config.pages.length,
          deletedPages: parsed.deleted_pages || 0,
          rotatedPages: parsed.rotated_pages || 0,
          originalTotalSize: buffer.length,
          outputSize: parsed.output_size || outputBuffer.length,
        },
      };
    } finally {
      this.cleanupTempFiles(inputPath, requestPath, outputPath, workDir);
    }
  }
}

module.exports = { PdfOrganizer };