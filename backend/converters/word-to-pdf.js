/**
 * Word to PDF Converter
 * Uses LibreOffice headless for high-fidelity conversion
 * Preserves fonts, layout, headers/footers, tables, images
 */

const fs = require('fs');
const path = require('path');
const { BaseConverter } = require('./base');
const { ConversionError, ERROR_CODES } = require('./types');
const {
  requireLibreOffice,
  convertToPdf,
  validatePdfBuffer,
} = require('./libreoffice');

const WORD_SIGNATURES = [
  { offset: 0, bytes: [0x50, 0x4B, 0x03, 0x04], format: 'docx' }, // PK (ZIP-based)
  { offset: 0, bytes: [0xD0, 0xCF, 0x11, 0xE0], format: 'doc' },  // OLE compound
];

class WordToPdfConverter extends BaseConverter {
  constructor() {
    super();
    this.maxFileSize = this.getMaxFileSize('office');
  }

  async convert({ inputBuffer, inputFormat, outputFormat, options = {} }) {
    const totalStart = process.hrtime.bigint();
    const timings = {};

    this.validateFileSize(inputBuffer, this.maxFileSize);

    const detectedFormat = this.validateFileSignature(inputBuffer, WORD_SIGNATURES);
    if (!detectedFormat) {
      throw new ConversionError(
        'File is not a valid Word document (DOCX or DOC)',
        ERROR_CODES.INVALID_INPUT
      );
    }

    const inputExt = inputFormat === 'doc' ? 'doc' : 'docx';
    const workDir = this.generateTempWorkDir();
    const inputPath = path.join(workDir, `input.${inputExt}`);
    const outputPath = path.join(workDir, 'input.pdf');
    const profileDir = path.join(workDir, 'profile');

    try {
      // 1. Write input file
      const writeStart = process.hrtime.bigint();
      fs.writeFileSync(inputPath, inputBuffer);
      timings.writeInputMs = Number(process.hrtime.bigint() - writeStart) / 1_000_000;

      // 2. Require LibreOffice executable
      const requireStart = process.hrtime.bigint();
      const executable = requireLibreOffice('Word to PDF');
      timings.requireLibreOfficeMs = Number(process.hrtime.bigint() - requireStart) / 1_000_000;

      // 3. Convert to PDF (includes LibreOffice startup + conversion)
      const convertStart = process.hrtime.bigint();
      await convertToPdf({
        executable,
        inputPath,
        outputDir: workDir,
        profileDir,
      });
      timings.libreofficeConversionMs = Number(process.hrtime.bigint() - convertStart) / 1_000_000;

      // 4. Read output PDF
      const readStart = process.hrtime.bigint();
      const outputBuffer = await this.readOutputBuffer(outputPath);
      timings.readOutputMs = Number(process.hrtime.bigint() - readStart) / 1_000_000;

      // 5. Validate PDF
      const validateStart = process.hrtime.bigint();
      validatePdfBuffer(outputBuffer);
      timings.validatePdfMs = Number(process.hrtime.bigint() - validateStart) / 1_000_000;

      timings.totalMs = Number(process.hrtime.bigint() - totalStart) / 1_000_000;

      console.log(
        JSON.stringify({
          type: "word_to_pdf_conversion",
          success: true,
          timings: Object.fromEntries(Object.entries(timings).map(([k, v]) => [k, Math.round(v * 100) / 100])),
          inputFileSize: inputBuffer.length,
          outputFileSize: outputBuffer.length,
        })
      );

      return outputBuffer;
    } finally {
      const cleanupStart = process.hrtime.bigint();
      this.cleanupTempFiles(workDir);
      timings.cleanupMs = Number(process.hrtime.bigint() - cleanupStart) / 1_000_000;
    }
  }
}

module.exports = { WordToPdfConverter };
