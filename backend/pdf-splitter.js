/**
 * PDF Split module
 * Splits a single PDF into multiple output PDFs using the pypdf-based
 * Python processor (backend/pdf_splitter.py).
 *
 * Processing logic is kept separate from the Express route handler.
 */

const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const { spawn } = require("child_process");
const { v4: uuidv4 } = require("uuid");
const {
  ConversionError,
  ERROR_CODES,
  FILE_SIZE_LIMITS,
} = require("./converters/types");

const PDF_SPLITTER_SCRIPT = path.join(__dirname, "pdf_splitter.py");
const MAX_FILE_SIZE = FILE_SIZE_LIMITS.pdf || 50 * 1024 * 1024;
const PDF_SIGNATURE = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D]); // %PDF-

class PdfSplitter {
  constructor() {
    this.tempDir = path.join(__dirname, "temp");
    this.ensureTempDir();
  }

  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  generateTempPath(extension) {
    return path.join(this.tempDir, `${uuidv4()}.${extension}`);
  }

  cleanupTempFiles(...paths) {
    for (const filePath of paths) {
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
        console.warn(`[PdfSplitter] Failed to cleanup temp file ${filePath}:`, err.message);
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

      proc.on("close", (code) => {
        if (code !== 0) {
          reject(new ConversionError(
            `PDF split process failed with code ${code}: ${stderr}`,
            ERROR_CODES.CONVERSION_FAILED,
            { command, code, stderr: stderr.substring(0, 500) },
          ));
          return;
        }
        resolve({ stdout, stderr, code });
      });

      proc.on("error", (err) => {
        reject(new ConversionError(
          `Failed to spawn PDF split process: ${err.message}`,
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

  /**
   * Create a ZIP archive containing the given {name, buffer} entries.
   */
  createZipArchive(entries) {
    return new Promise((resolve, reject) => {
      const archive = archiver("zip", { zlib: { level: 6 } });
      const chunks = [];

      archive.on("data", (chunk) => chunks.push(chunk));
      archive.on("end", () => resolve(Buffer.concat(chunks)));
      archive.on("error", (err) =>
        reject(new ConversionError(
          `ZIP creation failed: ${err.message}`,
          ERROR_CODES.CONVERSION_FAILED,
          { originalError: err.message },
        )),
      );

      for (const entry of entries) {
        archive.append(entry.buffer, { name: entry.name });
      }

      archive.finalize();
    });
  }

  /**
   * Split an uploaded PDF into multiple output PDFs packaged as a ZIP.
   * @param {Object} file - {buffer: Buffer, originalName: string, size: number}
   * @param {Object} config - { mode, ranges?, everyN? }
   *   mode: "ranges" | "every_n" | "every_page"
   *   ranges: JSON string of [{start,end}] (mode "ranges")
   *   everyN: number of pages per output (mode "every_n")
   * @returns {Promise<{buffer: Buffer, filename: string, stats: Object, outputs: Array}>}
   */
  async split(file, config) {
    const { buffer, originalName, size } = file;

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

    const mode = config && config.mode;
    if (!mode || !["ranges", "every_n", "every_page"].includes(mode)) {
      throw new ConversionError(
        "Invalid split mode. Use ranges, every_n or every_page.",
        ERROR_CODES.INVALID_INPUT,
      );
    }

    let modeArg = "";
    if (mode === "ranges") {
      modeArg = config && config.ranges ? JSON.stringify(config.ranges) : "[]";
    } else if (mode === "every_n") {
      modeArg = config && config.everyN !== undefined ? String(config.everyN) : "";
    }

    // Unique temp directory per request so concurrent splits never collide.
    const requestId = uuidv4();
    const workDir = path.join(this.tempDir, `split_${requestId}`);
    fs.mkdirSync(workDir, { recursive: true });

    const inputPath = path.join(workDir, `${uuidv4()}.pdf`);
    fs.writeFileSync(inputPath, buffer);

    try {
      // Confirm the Python tooling is available before processing.
      const pythonBin = this.getPythonBin();
      const check = await this.runCommand(pythonBin, [PDF_SPLITTER_SCRIPT, "--check"], {
        timeout: 30000,
      });
      const checkResult = this.lastJsonLine(check.stdout);
      if (!checkResult || !checkResult.success) {
        throw new ConversionError(
          "PDF split service unavailable",
          ERROR_CODES.MISSING_DEPENDENCY,
          { detail: checkResult && checkResult.error },
        );
      }

      // Run the split: output dir, input path, mode, mode arg.
      const splitResult = await this.runCommand(
        pythonBin,
        [PDF_SPLITTER_SCRIPT, workDir, inputPath, mode, modeArg],
        { timeout: 300000 },
      );

      const parsed = this.lastJsonLine(splitResult.stdout);
      if (!parsed || !parsed.success) {
        throw new ConversionError(
          parsed && parsed.error ? parsed.error : "PDF split failed",
          parsed && parsed.code ? parsed.code : ERROR_CODES.CONVERSION_FAILED,
          { detail: parsed },
        );
      }

      const outputs = parsed.outputs || [];
      if (outputs.length === 0) {
        throw new ConversionError(
          "PDF split produced no outputs",
          ERROR_CODES.CONVERSION_FAILED,
        );
      }

      // Read each output PDF into memory for zipping.
      const entries = [];
      let totalOutputSize = 0;
      for (const out of outputs) {
        const outPath = path.join(workDir, out.filename);
        if (!fs.existsSync(outPath)) {
          throw new ConversionError(
            `Split output was not created: ${out.filename}`,
            ERROR_CODES.CONVERSION_FAILED,
          );
        }
        const outBuffer = fs.readFileSync(outPath);
        totalOutputSize += outBuffer.length;
        entries.push({ name: out.filename, buffer: outBuffer });
      }

      const zipBuffer = await this.createZipArchive(entries);

      // Derive a sensible output filename from the input.
      const baseName = (originalName || "document").replace(/\.pdf$/i, "");
      const filename = `${baseName}_split.zip`;

      return {
        buffer: zipBuffer,
        filename,
        stats: {
          inputPages: parsed.input_pages || 0,
          outputFiles: outputs.length,
          mode,
          originalTotalSize: buffer.length,
          outputSize: zipBuffer.length,
          totalOutputSize,
        },
        outputs: outputs.map((o) => ({
          filename: o.filename,
          pages: o.pages,
          pageCount: o.page_count,
        })),
      };
    } finally {
      this.cleanupTempFiles(inputPath, workDir);
    }
  }
}

module.exports = { PdfSplitter };
