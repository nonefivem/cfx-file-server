import { promises as fs, createReadStream } from "node:fs";
import { join, extname } from "node:path";
import type { ServerResponse } from "http";
import { config } from "../config";
import type { ParsedFile } from "../utils/multipart";

class UploadService {
  private readonly uploadDir = config.uploads.directory;
  private readonly maxFileSizeMB = config.uploads.maxFileSizeMB;
  readonly maxFileSizeBytes = this.maxFileSizeMB * 1024 * 1024;
  private readonly allowedMimeTypes = config.uploads.allowedMimeTypes;

  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
  }

  private sanitizeFilename(filename: string): string {
    // Keep extension, sanitize name
    const ext = extname(filename);
    const name = filename.replace(ext, "").replace(/[^a-zA-Z0-9_-]/g, "_");
    return `${name}${ext}`;
  }

  private generateUniqueFilename(originalFilename: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const sanitized = this.sanitizeFilename(originalFilename);
    const ext = extname(sanitized);
    const name = sanitized.replace(ext, "");
    return `${name}_${timestamp}_${random}${ext}`;
  }

  validateFile(file: ParsedFile): { valid: boolean; error?: string } {
    if (file.size > this.maxFileSizeBytes) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${this.maxFileSizeMB}MB`
      };
    }

    if (!this.allowedMimeTypes.includes(file.mimeType)) {
      return {
        valid: false,
        error: `File type ${file.mimeType} is not allowed. Allowed types: ${this.allowedMimeTypes.join(", ")}`
      };
    }

    return { valid: true };
  }

  async save(file: ParsedFile): Promise<string> {
    await this.ensureUploadDir();

    const filename = this.generateUniqueFilename(file.filename);
    const filePath = join(this.uploadDir, filename);

    // Write buffer directly - no extra copy
    await fs.writeFile(filePath, file.buffer);

    return filename;
  }

  async get(filename: string): Promise<Buffer | null> {
    await this.ensureUploadDir();

    const sanitized = this.sanitizeFilename(filename);
    const filePath = join(this.uploadDir, sanitized);

    try {
      return await fs.readFile(filePath);
    } catch (error) {
      return null;
    }
  }

  /**
   * Stream file directly to response - much better for large files
   * Avoids loading entire file into memory
   */
  async stream(filename: string, res: ServerResponse): Promise<boolean> {
    await this.ensureUploadDir();

    const sanitized = this.sanitizeFilename(filename);
    const filePath = join(this.uploadDir, sanitized);

    try {
      const stat = await fs.stat(filePath);
      const mimeType = this.getMimeType(filename);

      res.writeHead(200, {
        "Content-Type": mimeType,
        "Content-Length": stat.size.toString(),
        "Cache-Control": "public, max-age=31536000, immutable"
      });

      const stream = createReadStream(filePath);
      stream.pipe(res);

      return new Promise(resolve => {
        stream.on("end", () => resolve(true));
        stream.on("error", () => resolve(false));
      });
    } catch (error) {
      return false;
    }
  }

  async exists(filename: string): Promise<boolean> {
    await this.ensureUploadDir();

    const sanitized = this.sanitizeFilename(filename);
    const filePath = join(this.uploadDir, sanitized);

    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  async remove(filename: string): Promise<boolean> {
    await this.ensureUploadDir();

    const sanitized = this.sanitizeFilename(filename);
    const filePath = join(this.uploadDir, sanitized);

    try {
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  async list(): Promise<string[]> {
    await this.ensureUploadDir();

    try {
      return await fs.readdir(this.uploadDir);
    } catch (error) {
      return [];
    }
  }

  getMimeType(filename: string): string {
    const ext = extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".pdf": "application/pdf",
      ".mp4": "video/mp4",
      ".webm": "video/webm",
      ".ogv": "video/ogg",
      ".mp3": "audio/mpeg",
      ".ogg": "audio/ogg",
      ".wav": "audio/wav",
      ".weba": "audio/webm"
    };
    return mimeTypes[ext] || "application/octet-stream";
  }
}

export type { UploadService };
export const uploadService = new UploadService();
