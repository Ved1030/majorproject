/**
 * Base Converter Class
 * Provides common utilities for all converters
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const { ConversionError, ERROR_CODES, FILE_SIZE_LIMITS, MIME_TYPES, SUPPORTED_FORMATS } = require('./types');

// Tooling check cache - shared across all converter instances
const toolingCache = new Map();
const TOOLING_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class BaseConverter {
  constructor() {
    this.tempDir = path.join(__dirname, '..', 'temp');
    this.ensureTempDir();
  }

  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  generateTempPath(extension) {
    if (!extension) {
      return path.join(this.tempDir, uuidv4());
    }
    return path.join(this.tempDir, `${uuidv4()}.${extension}`);
  }

  generateTempProfileDir() {
    const profileDir = path.join(this.tempDir, `lo-profile-${uuidv4()}`);
    fs.mkdirSync(profileDir, { recursive: true });
    return profileDir;
  }

  generateTempWorkDir() {
    const workDir = path.join(this.tempDir, `convert-${uuidv4()}`);
    fs.mkdirSync(workDir, { recursive: true });
    return workDir;
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
        console.warn(`[Converter] Failed to cleanup temp file ${filePath}:`, err.message);
      }
    }
  }

  getSpawnOptions(options = {}) {
    const spawnOptions = {
      env: { ...process.env, ...options.env },
      cwd: options.cwd || process.cwd(),
      timeout: options.timeout || 120000,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    };

    if (process.platform === 'win32') {
      const CREATE_NO_WINDOW = 0x08000000;
      spawnOptions.windowsVerbatimArguments = false;
      spawnOptions.windowsHide = true;
    }

    return spawnOptions;
  }

  async runCommand(command, args, options = {}) {
    const startTime = process.hrtime.bigint();
    return new Promise((resolve, reject) => {
      const spawnOptions = this.getSpawnOptions(options);
      const proc = spawn(command, args, spawnOptions);

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        const endTime = process.hrtime.bigint();
        const durationMs = Number(endTime - startTime) / 1_000_000;
        
        if (code !== 0) {
          console.error(JSON.stringify({
            type: "subprocess",
            command,
            args: args.slice(0, 3), // Log first 3 args to avoid PII
            code,
            durationMs: Math.round(durationMs * 100) / 100,
            success: false,
            stderr: stderr.substring(0, 500), // Limit stderr length
          }));
          reject(new ConversionError(
            `Command failed with code ${code}: ${stderr}`,
            ERROR_CODES.CONVERSION_FAILED,
            { command, args, code, stderr }
          ));
        } else {
          console.log(JSON.stringify({
            type: "subprocess",
            command,
            args: args.slice(0, 3),
            code,
            durationMs: Math.round(durationMs * 100) / 100,
            success: true,
          }));
          resolve({ stdout, stderr, code });
        }
      });

      proc.on('error', (err) => {
        const endTime = process.hrtime.bigint();
        const durationMs = Number(endTime - startTime) / 1_000_000;
        console.error(JSON.stringify({
          type: "subprocess",
          command,
          args: args.slice(0, 3),
          durationMs: Math.round(durationMs * 100) / 100,
          success: false,
          error: err.message,
        }));
        reject(new ConversionError(
          `Failed to spawn process: ${err.message}`,
          ERROR_CODES.CONVERSION_FAILED,
          { command, args, error: err.message }
        ));
      });
    });
  }

  async runPythonScript(scriptPath, args = []) {
    const pythonBin = this.getPythonBin();
    return this.runCommand(pythonBin, [scriptPath, ...args]);
  }

  getPythonBin() {
    const venvPython = path.join(__dirname, '..', '.venv', 'bin', 'python');
    if (fs.existsSync(venvPython)) return venvPython;
    
    const venvPythonWin = path.join(__dirname, '..', '.venv', 'Scripts', 'python.exe');
    if (fs.existsSync(venvPythonWin)) return venvPythonWin;
    
    return process.platform === 'win32' ? 'python' : 'python3';
  }

  /**
   * Cached tooling check - avoids repeated subprocess calls
   * @param {string} cacheKey - Unique key for this tooling check
   * @param {Function} checkFn - Async function that performs the actual check
   * @returns {Promise<Object>} Check result
   */
  async checkToolingCached(cacheKey, checkFn) {
    const cached = toolingCache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp < TOOLING_CACHE_TTL)) {
      return cached.result;
    }
    
    const result = await checkFn();
    toolingCache.set(cacheKey, { result, timestamp: now });
    return result;
  }

  /**
   * Invalidate tooling cache for a specific key
   * @param {string} cacheKey 
   */
  invalidateToolingCache(cacheKey) {
    toolingCache.delete(cacheKey);
  }

  validateFileSize(buffer, maxSize) {
    if (buffer.length > maxSize) {
      throw new ConversionError(
        `File size exceeds limit of ${Math.round(maxSize / 1024 / 1024)} MB`,
        ERROR_CODES.FILE_TOO_LARGE,
        { size: buffer.length, maxSize }
      );
    }
  }

  validateFileSignature(buffer, signatures) {
    for (const { offset, bytes, format } of signatures) {
      const slice = buffer.slice(offset, offset + bytes.length);
      if (slice.equals(Buffer.from(bytes))) {
        return format;
      }
    }
    return null;
  }

  async readOutputBuffer(outputPath) {
    if (!fs.existsSync(outputPath)) {
      throw new ConversionError(
        'Output file was not created',
        ERROR_CODES.CONVERSION_FAILED
      );
    }
    const buffer = fs.readFileSync(outputPath);
    if (buffer.length === 0) {
      throw new ConversionError(
        'Conversion produced empty output',
        ERROR_CODES.CONVERSION_FAILED
      );
    }
    return buffer;
  }

  // Shared methods from ConverterInterface
  getMaxFileSize(format) {
    return FILE_SIZE_LIMITS[format] || FILE_SIZE_LIMITS.default;
  }

  getMimeType(format) {
    return MIME_TYPES[format] || 'application/octet-stream';
  }

  getSupportedOutputFormats(inputFormat) {
    return SUPPORTED_FORMATS[inputFormat] || [];
  }

  isConversionSupported(inputFormat, outputFormat) {
    const supported = this.getSupportedOutputFormats(inputFormat);
    return supported.includes(outputFormat);
  }
}

module.exports = { BaseConverter };