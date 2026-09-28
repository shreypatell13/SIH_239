/**
 * Magic-Byte File Validation
 * Phase 2F: Document Intelligence Security Gate
 */

export interface MagicByteValidationResult {
  isValid: boolean;
  detectedMimeType?: string;
  error?: string;
}

export class MagicByteValidator {
  /**
   * Validates if file buffer matches declared MIME type and valid signatures.
   */
  static validate(buffer: Buffer, declaredMimeType: string): MagicByteValidationResult {
    if (!buffer || buffer.length < 4) {
      return {
        isValid: false,
        error: "FILE_TOO_SHORT_OR_EMPTY",
      };
    }

    const isPdf =
      buffer.length >= 5 &&
      buffer[0] === 0x25 && // %
      buffer[1] === 0x50 && // P
      buffer[2] === 0x44 && // D
      buffer[3] === 0x46 && // F
      buffer[4] === 0x2d; // -

    const isJpeg =
      buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

    const isPng =
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 && // P
      buffer[2] === 0x4e && // N
      buffer[3] === 0x47 && // G
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a;

    let detected: string | undefined;
    if (isPdf) detected = "application/pdf";
    else if (isJpeg) detected = "image/jpeg";
    else if (isPng) detected = "image/png";

    if (!detected) {
      return {
        isValid: false,
        error: "UNKNOWN_MAGIC_BYTES",
      };
    }

    // Check if detected signature matches declared MIME
    const normalizedDeclared = declaredMimeType.toLowerCase().trim();
    if (
      (detected === "application/pdf" && normalizedDeclared === "application/pdf") ||
      (detected === "image/jpeg" &&
        (normalizedDeclared === "image/jpeg" || normalizedDeclared === "image/jpg")) ||
      (detected === "image/png" && normalizedDeclared === "image/png")
    ) {
      return {
        isValid: true,
        detectedMimeType: detected,
      };
    }

    return {
      isValid: false,
      detectedMimeType: detected,
      error: `MIME_SIGNATURE_MISMATCH: declared ${declaredMimeType} but detected ${detected}`,
    };
  }
}
