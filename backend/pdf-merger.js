/**
 * PDF Merge module
 * Merges multiple uploaded PDFs in the exact supplied order using the
 * pypdf-based Python processor (backend/pdf_merger.py).
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

const PDF_MERGER_SCRIPT = path.join(__dirname, "pdf_merger.py");
const MAX_FILE_COUNT = 10;
const PDF_SIGNATURE = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D]); // %PDF-

class PdfMerger {
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
        console.warn(`[PdfMerger] Failed to cleanup temp file ${filePath}:`, err.message);
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
            `PDF merge process failed with code ${code}: ${stderr}`,
            ERROR_CODES.CONVERSION_FAILED,
            { command, code, stderr: stderr.substring(0, 500) },
          ));
          return;
        }
        resolve({ stdout, stderr, code });
      });

      proc.on("error", (err) => {
        reject(new ConversionError(
          `Failed to spawn PDF merge process: ${err.message}`,
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
   * Merge an ordered list of uploaded PDF files.
   * @param {Array<{buffer: Buffer, originalName: string, size: number}>} files
   * @returns {Promise<{buffer: Buffer, filename: string, stats: Object}>}
   */
  async merge(files) {
    if (!Array.isArray(files) || files.length === 0) {
      throw new ConversionError("No files uploaded", ERROR_CODES.INVALID_INPUT);
    }
    if (files.length > MAX_FILE_COUNT) {
      throw new ConversionError(
        `Maximum of ${MAX_FILE_COUNT} PDF files can be merged at once`,
        ERROR_CODES.FILE_TOO_LARGE,
        { maxFiles: MAX_FILE_COUNT, provided: files.length },
      );
    }

    const maxFileSize = FILE_SIZE_LIMITS.pdf || 50 * 1024 * 1024;

    const inputPaths = [];
    const outputPath = this.generateTempPath("pdf");
    let originalTotalSize = 0;

    try {
      // Validate + stage each uploaded file into a uniquely-named temp file.
      for (const file of files) {
        const { buffer, originalName, size } = file;

        if (!buffer || buffer.length === 0) {
          throw new ConversionError(
            `Empty file uploaded: ${originalName || "unknown"}`,
            ERROR_CODES.EMPTY_FILE,
            { file: originalName },
          );
        }

        if (buffer.length > maxFileSize) {
          throw new ConversionError(
            `File too large: ${originalName}`,
            ERROR_CODES.FILE_TOO_LARGE,
            { file: originalName, size: buffer.length, maxSize: maxFileSize },
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

        const inputPath = path.join(this.tempDir, `${uuidv4()}.pdf`);
        fs.writeFileSync(inputPath, buffer);

        inputPaths.push(inputPath);
        originalTotalSize += buffer.length;
      }

      // Confirm the Python tooling is available before processing.
      const pythonBin = this.getPythonBin();
      const check = await this.runCommand(pythonBin, [PDF_MERGER_SCRIPT, "--check"], {
        timeout: 30000,
      });
      const checkResult = this.lastJsonLine(check.stdout);
      if (!checkResult || !checkResult.success) {
        throw new ConversionError(
          "PDF merge service unavailable",
          ERROR_CODES.MISSING_DEPENDENCY,
          { detail: checkResult && checkResult.error },
        );
      }

      // Run the merge: output path first, then inputs in order.
      const mergeResult = await this.runCommand(
        pythonBin,
        [PDF_MERGER_SCRIPT, outputPath, ...inputPaths],
        { timeout: 300000 },
      );

      const parsed = this.lastJsonLine(mergeResult.stdout);
      if (!parsed || !parsed.success) {
        throw new ConversionError(
          parsed && parsed.error ? parsed.error : "PDF merge failed",
          parsed && parsed.code ? parsed.code : ERROR_CODES.CONVERSION_FAILED,
          { detail: parsed },
        );
      }

      if (!fs.existsSync(outputPath)) {
        throw new ConversionError("Merged output file was not created", ERROR_CODES.CONVERSION_FAILED);
      }

      const buffer = fs.readFileSync(outputPath);
      if (buffer.length === 0) {
        throw new ConversionError("PDF merge produced empty output", ERROR_CODES.CONVERSION_FAILED);
      }

      // Derive a sensible output filename from the first input.
      const firstName = files[0].originalName || "merged";
      const baseName = firstName.replace(/\.pdf$/i, "");
      const filename = `${baseName}_merged.pdf`;

      return {
        buffer,
        filename,
        stats: {
          inputFiles: parsed.input_files || files.length,
          pageCount: parsed.page_count || 0,
          originalTotalSize: parsed.original_total_size !== undefined
            ? parsed.original_total_size
            : originalTotalSize,
          outputSize: parsed.output_size !== undefined
            ? parsed.output_size
            : buffer.length,
        },
      };
    } finally {
      this.cleanupTempFiles(...inputPaths, outputPath);
    }
  }
}

module.exports = { PdfMerger, MAX_FILE_COUNT };
